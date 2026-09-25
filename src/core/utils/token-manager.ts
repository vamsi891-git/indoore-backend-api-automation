import fs from "fs";
import path from "path";
import { AuthApi } from "./auth.util";
import { AuthGate } from "./auth-gate.util";
import { LoggerEngine } from "../engine/logger.engine";
import { normalizeApiBaseUrl } from "./api-path.util";
import { env } from "../config/env.schema";

interface StoredToken {
  accessToken: string;
  expiresAt: number;
  csrfToken?: string;
  origin?: string;
}

function apiOrigin(): string {
  return normalizeApiBaseUrl(env.BASE_URL);
}

function isTwoFactorSecretUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("TWO_FACTOR_SECRET_UNAVAILABLE");
}

export class TokenManager {
  private static token: string | null = null;
  private static csrfToken: string | null = null;
  private static refreshAtEpochMs = 0;
  private static refreshPromise: Promise<void> | null = null;
  /** Block captcha re-login while the auth API is rate-limiting us (see AuthGate). */
  private static loginCooldownUntilMs = 0;

  private static readonly defaultExpirySeconds = 900;
  /** Slow DTR endpoints can take >2 minutes; do not start a request with a token that dies mid-call. */
  private static readonly refreshBufferMs = 180_000;
  private static readonly lockWaitMs = 120_000;
  private static readonly lockPollMs = 250;
  private static readonly loginCooldownMs = 120_000;
  private static readonly authDir = path.join(process.cwd(), "playwright", ".auth");
  private static readonly tokenFilePath = path.join(TokenManager.authDir, "token.json");
  private static readonly lockFilePath = path.join(TokenManager.authDir, "refresh.lock");

  static async getToken(): Promise<string> {
    this.syncFromDisk();
    if (this.shouldRefresh()) {
      await this.refreshToken(false);
    }
    if (!this.token) {
      throw new Error("Token unavailable after refresh");
    }
    return this.token;
  }
  static async getCsrf(): Promise<string> {
    this.syncFromDisk();
    if (this.shouldRefresh()) {
      await this.refreshToken(false);
    }
    if (!this.csrfToken) {
      throw new Error("CSRF token unavailable after refresh");
    }
    return this.csrfToken;
  }
  static async handleUnauthorized(currentToken: string): Promise<string> {
    // Prefer refresh — full captcha login on every 401 causes device-limit + 429 storms in CI.
    if (currentToken) {
      try {
        LoggerEngine.info("401 recovery: attempting token refresh (no captcha)");
        const refreshed = await AuthApi.refresh(currentToken);
        this.applySession(refreshed);
        this.persistToken(this.token!, this.expiresAtEpochMs());
        return this.token!;
      } catch (error) {
        LoggerEngine.info(
          `401 recovery: refresh failed (${error instanceof Error ? error.message : String(error)}); will try login if cooldown allows`,
        );
      }
    }

    if (AuthGate.isRateLimited()) {
      AuthGate.assertNotRateLimited("captcha re-login after 401");
    }

    if (Date.now() < this.loginCooldownUntilMs) {
      const waitSec = Math.ceil((this.loginCooldownUntilMs - Date.now()) / 1000);
      throw new Error(
        `Login cooldown active (~${waitSec}s). A captcha login just ran; refusing another to avoid 429/device-limit thrash.`,
      );
    }

    this.loginCooldownUntilMs = Date.now() + this.loginCooldownMs;
    this.discardStoredSession();
    await this.refreshToken(true);
    if (!this.token || this.token === currentToken) {
      throw new Error("Token unavailable after unauthorized recovery");
    }
    return this.token;
  }

  static discardStoredSession(): void {
    this.reset();
    try {
      if (fs.existsSync(this.tokenFilePath)) {
        fs.unlinkSync(this.tokenFilePath);
      }
    } catch {
      // ignore missing file
    }
  }

  /** Force login/refresh to obtain a fresh CSRF token (e.g. after CSRF_MISMATCH). */
  static async forceSessionRefresh(): Promise<void> {
    await this.refreshToken(true);
    if (!this.token || !this.csrfToken) {
      throw new Error("Session refresh did not return token + CSRF");
    }
  }

  static seed(
    accessToken: string,
    expiresInSeconds = this.defaultExpirySeconds,
    csrfToken?: string,
  ): void {
    this.applyToken(accessToken, expiresInSeconds);
    if (csrfToken) {
      this.csrfToken = csrfToken;
    }
    this.persistToken(this.token!, this.expiresAtEpochMs());
  }
  static reset(): void {
    this.token = null;
    this.csrfToken = null;
    this.refreshAtEpochMs = 0;
    this.refreshPromise = null;
  }
  static clearStaleLock(): void {
    this.tryBreakStaleLock(true);
  }

  /** Drop refresh.lock when it is missing a timestamp or older than lockWaitMs. */
  private static tryBreakStaleLock(force = false): void {
    if (!fs.existsSync(this.lockFilePath)) {
      return;
    }
    if (force) {
      this.releaseLock();
      return;
    }
    try {
      const raw = fs.readFileSync(this.lockFilePath, "utf-8");
      const lockTime = Number(raw.split(":")[1]);
      if (!Number.isFinite(lockTime) || Date.now() - lockTime > this.lockWaitMs) {
        this.releaseLock();
      }
    } catch {
      this.releaseLock();
    }
  }

  /** Reuse a still-valid token from disk to avoid flaky login during global setup. */
  static loadValidSession(): {
    accessToken: string;
    expiresInSeconds: number;
    csrfToken?: string;
  } | null {
    const stored = this.readStoredToken();
    if (!stored) {
      return null;
    }
    const remainingMs = stored.expiresAt - Date.now();
    // seed() → applyToken() subtracts refreshBufferMs once. Require 2× buffer so
    // refreshAt stays in the future after seeding (avoids immediate refresh of a
    // wall-clock-valid but server-revoked session).
    if (remainingMs <= this.refreshBufferMs * 2) {
      return null;
    }
    return {
      accessToken: stored.accessToken,
      // Pass full remaining lifetime; applyToken subtracts the buffer once.
      expiresInSeconds: Math.max(60, Math.floor(remainingMs / 1000)),
      csrfToken: stored.csrfToken,
    };
  }

  private static shouldRefresh(): boolean {
    return !this.token || Date.now() >= this.refreshAtEpochMs;
  }

  private static expiresAtEpochMs(): number {
    return this.refreshAtEpochMs + this.refreshBufferMs;
  }

  private static applyToken(accessToken: string, expiresInSeconds: number): void {
    this.token = accessToken;
    this.refreshAtEpochMs = Date.now() + expiresInSeconds * 1000 - this.refreshBufferMs;
  }
  private static applySession(session: {
    accessToken: string;
    expiresIn?: number;
    csrfToken: string;
  }): void {
    this.applyToken(session.accessToken, session.expiresIn ?? this.defaultExpirySeconds);
    this.csrfToken = session.csrfToken;
  }
  private static syncFromDisk(): void {
    const stored = this.readStoredToken();
    if (!stored) {
      return;
    }
    const storedRefreshAt = stored.expiresAt - this.refreshBufferMs;
    const memoryExpiresAt = this.token ? this.expiresAtEpochMs() : 0;
    if (!this.token || stored.expiresAt > memoryExpiresAt) {
      this.token = stored.accessToken;
      this.refreshAtEpochMs = storedRefreshAt;
    }
    if (stored.csrfToken) {
      this.csrfToken = stored.csrfToken;
    }
  }
  private static async refreshToken(force: boolean): Promise<void> {
    if (this.refreshPromise) {
      await this.refreshPromise;
      return;
    }
    this.refreshPromise = this.runRefresh(force);
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }
  private static async runRefresh(force: boolean): Promise<void> {
    await this.withRefreshLock(async () => {
      this.syncFromDisk();
      if (!force && this.token && Date.now() < this.refreshAtEpochMs) {
        return;
      }
      const previousToken = this.token;
      LoggerEngine.info(force ? "Token force refresh started" : "Token refresh started");
      try {
        if (previousToken) {
          const refreshed = await AuthApi.refresh(previousToken);
          this.applySession(refreshed);
        } else {
          this.applySession(await AuthApi.login());
        }
      } catch (error) {
        if (isTwoFactorSecretUnavailable(error)) {
          throw error;
        }
        LoggerEngine.info("Refresh failed; falling back to login");
        try {
          this.applySession(await AuthApi.login());
        } catch (loginError) {
          if (isTwoFactorSecretUnavailable(loginError) && previousToken) {
            LoggerEngine.info(
              "Cannot re-login (2FA secret unavailable); keeping the current token",
            );
            return;
          }
          throw loginError;
        }
      }

      this.persistToken(this.token!, this.expiresAtEpochMs());
      LoggerEngine.info(
        `Token refresh successful; next refresh at ${new Date(this.refreshAtEpochMs).toISOString()}`,
      );
    });
  }
  private static async withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
    this.ensureAuthDir();
    const deadline = Date.now() + this.lockWaitMs;
    while (Date.now() < deadline) {
      this.tryBreakStaleLock();
      try {
        fs.writeFileSync(this.lockFilePath, `${process.pid}:${Date.now()}`, { flag: "wx" });
        try {
          return await task();
        } finally {
          this.releaseLock();
        }
      } catch {
        this.syncFromDisk();
        if (this.token && Date.now() < this.refreshAtEpochMs) {
          return undefined as T;
        }
        await this.sleep(this.lockPollMs);
      }
    }
    throw new Error("Timed out waiting for token refresh lock");
  }
  private static releaseLock(): void {
    try {
      if (fs.existsSync(this.lockFilePath)) {
        fs.unlinkSync(this.lockFilePath);
      }
    } catch {
      // Ignore stale lock cleanup races between workers.
    }
  }
  private static readStoredToken(): StoredToken | null {
    if (!fs.existsSync(this.tokenFilePath)) {
      return null;
    }
    try {
      const parsed = JSON.parse(fs.readFileSync(this.tokenFilePath, "utf-8")) as StoredToken;
      if (!parsed.accessToken || !parsed.expiresAt || parsed.expiresAt <= Date.now()) {
        return null;
      }
      if (parsed.origin && parsed.origin !== apiOrigin()) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
  private static persistToken(accessToken: string, expiresAt: number): void {
    this.ensureAuthDir();
    const payload = JSON.stringify(
      {
        accessToken,
        expiresAt,
        origin: apiOrigin(),
        ...(this.csrfToken ? { csrfToken: this.csrfToken } : {}),
      } satisfies StoredToken,
      null,
      2,
    );
    // Atomic replace so parallel workers never read a half-written token.json.
    const tmpPath = `${this.tokenFilePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpPath, payload, "utf-8");
    try {
      fs.renameSync(tmpPath, this.tokenFilePath);
    } catch {
      // Windows: rename onto existing file can fail — fall back to overwrite.
      fs.writeFileSync(this.tokenFilePath, payload, "utf-8");
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        // ignore tmp cleanup races
      }
    }
  }
  private static ensureAuthDir(): void {
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
