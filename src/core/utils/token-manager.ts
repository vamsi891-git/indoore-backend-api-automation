import fs from "fs";
import path from "path";
import { AuthApi } from "./auth.util";
import { LoggerEngine } from "../engine/logger.engine";

interface StoredToken {
  accessToken: string;
  expiresAt: number;
  csrfToken?: string;
}

export class TokenManager {
  private static token: string | null = null;
  private static csrfToken: string | null = null;
  private static refreshAtEpochMs = 0;
  private static refreshPromise: Promise<void> | null = null;

  private static readonly defaultExpirySeconds = 900;
  private static readonly refreshBufferMs = 60_000;
  private static readonly lockWaitMs = 120_000;
  private static readonly lockPollMs = 250;
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
    this.syncFromDisk();

    if (this.token && this.token !== currentToken) {
      return this.token;
    }

    if (Date.now() < this.refreshAtEpochMs) {
      return currentToken;
    }

    await this.refreshToken(true);

    if (!this.token) {
      throw new Error("Token unavailable after unauthorized recovery");
    }

    return this.token;
  }

  static seed(
    accessToken: string,
    expiresInSeconds = this.defaultExpirySeconds,
    csrfToken?: string
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
    if (fs.existsSync(this.lockFilePath)) {
      fs.unlinkSync(this.lockFilePath);
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
    if (remainingMs <= this.refreshBufferMs) {
      return null;
    }

    return {
      accessToken: stored.accessToken,
      expiresInSeconds: Math.max(
        60,
        Math.floor((remainingMs - this.refreshBufferMs) / 1000),
      ),
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
      } catch {
        LoggerEngine.info("Refresh failed; falling back to login");
        this.applySession(await AuthApi.login());
      }

      this.persistToken(this.token!, this.expiresAtEpochMs());
      LoggerEngine.info(
        `Token refresh successful; next refresh at ${new Date(this.refreshAtEpochMs).toISOString()}`
      );
    });
  }

  private static async withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
    this.ensureAuthDir();
    const deadline = Date.now() + this.lockWaitMs;

    while (Date.now() < deadline) {
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
      return parsed;
    } catch {
      return null;
    }
  }

  private static persistToken(accessToken: string, expiresAt: number): void {
    this.ensureAuthDir();
    fs.writeFileSync(
      this.tokenFilePath,
      JSON.stringify(
        {
          accessToken,
          expiresAt,
          ...(this.csrfToken ? { csrfToken: this.csrfToken } : {})
        } satisfies StoredToken,
        null,
        2
      )
    );
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
