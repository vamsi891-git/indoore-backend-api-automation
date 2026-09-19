import { request } from "@playwright/test";
import fs from "fs";
import path from "path";
import { LoggerEngine } from "../engine/logger.engine";
import {
  enableStripIndorePrefix,
  resolveApiPath,
  normalizeApiBaseUrl,
} from "./api-path.util";
import { generateTotp, getTotpSecret } from "./totp.util";
import { solveCaptchaSvg } from "./captcha-ocr.util";

export interface LoginResponse {
  accessToken: string;
  expiresIn?: number;
  csrfToken: string;
}

interface AuthCookie {
  name: string;
  value: string;
}

interface DeviceSelectionDevice {
  id: string;
  lastSeenAt?: string | null;
}

interface TwoFactorBody {
  accessToken?: string;
  expiresIn?: number;
  requires2FA?: boolean;
  requiresDeviceSelection?: boolean;
  challengeToken?: string;
  devices?: DeviceSelectionDevice[];
}

type DeviceSelectionBody = TwoFactorBody;

export class AuthApi {
  private static readonly loginPath = "/indore/auth/login";
  private static readonly captchaPath = "/indore/auth/captcha";
  private static readonly login2faPath = "/indore/auth/login/2fa";
  private static readonly refreshPath = "/indore/auth/refresh";
  private static readonly releaseDevicePath = "/indore/auth/login/release-device";
  private static readonly devicesPath = "/indore/auth/devices";
  /**
   * Login backoff for 503 / pool contention. Keep this short: many login POSTs
   * trip CAPTCHA_REQUIRED on the same account.
   */
  private static readonly loginRetryMs = [0, 10_000, 30_000];
  private static readonly captchaOcrMaxAttempts = 5;
  /** One extra wait if the API already locked login behind captcha. */
  private static readonly captchaRetryWaitMs = 90_000;
  private static readonly retriablePreflightStatuses = new Set([502, 503, 504]);
  private static readonly retriableAuthStatuses = new Set([429, 502, 503, 504]);

  private static path(p: string): string {
    return resolveApiPath(p);
  }

  private static candidatePaths(indorePath: string): string[] {
    const stripped = indorePath.startsWith("/indore/")
      ? indorePath.slice("/indore".length)
      : indorePath;
    return Array.from(new Set([this.path(indorePath), stripped, indorePath]));
  }

  private static isRouteNotFound(status: number): boolean {
    return status === 404;
  }

  private static readonly storageStatePath = path.join(
    process.cwd(),
    "playwright",
    ".auth",
    "storage-state.json",
  );

  private static async createContext(reuseCookies = false) {
    const storageState =
      reuseCookies && fs.existsSync(this.storageStatePath)
        ? this.storageStatePath
        : undefined;
    return request.newContext({
      baseURL: normalizeApiBaseUrl(process.env.BASE_URL),
      ignoreHTTPSErrors: true,
      ...(storageState ? { storageState } : {}),
      extraHTTPHeaders: {
        Accept: "application/json",
        "User-Agent":
          process.env.API_USER_AGENT?.trim() ||
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
    });
  }

  private static lastStorageState: {
    cookies: AuthCookie[];
    origins?: unknown;
  } | null = null;

  private static async snapshotCookies(
    apiContext: Awaited<ReturnType<typeof request.newContext>>,
    headers: Record<string, string> = {},
  ): Promise<{ cookies: AuthCookie[] }> {
    try {
      this.lastStorageState = await apiContext.storageState();
    } catch {
      // Playwright can close the internal snapshot page after 2FA/device calls.
    }
    const cookies = this.lastStorageState?.cookies ?? [];
    if (cookies.length === 0) {
      const headerToken = this.readCsrfToken([], headers);
      if (headerToken) {
        return {
          cookies: [{ name: "csrf_token", value: headerToken }],
        };
      }
    }
    return { cookies };
  }

  private static persistStorageState(state: {
    cookies: AuthCookie[];
    origins?: unknown;
  }): void {
    const dir = path.dirname(this.storageStatePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.storageStatePath, JSON.stringify(state, null, 2), "utf8");
  }

  private static readCsrfToken(
    cookies: AuthCookie[],
    headers: Record<string, string>,
  ): string {
    const cookieToken = cookies.find((cookie) => cookie.name === "csrf_token")?.value;
    if (cookieToken) {
      return cookieToken;
    }

    return headers["x-csrf-token"] ?? headers["X-CSRF-Token"] ?? "";
  }

  private static unwrapLoginCaptcha(body: unknown): {
    captchaId?: string;
    text?: string;
    svg?: string;
  } {
    const root =
      body !== null && typeof body === "object"
        ? (body as Record<string, unknown>)
        : {};
    const nested =
      root.data !== null && typeof root.data === "object"
        ? (root.data as Record<string, unknown>)
        : root;
    return {
      captchaId:
        typeof nested.captchaId === "string" ? nested.captchaId : undefined,
      text: typeof nested.text === "string" ? nested.text : undefined,
      svg: typeof nested.svg === "string" ? nested.svg : undefined,
    };
  }

  /**
   * GET /auth/captcha. Uses plaintext `text` when the API returns it (non-prod).
   * Otherwise OCRs the SVG. Live API is GET, not POST.
   */
  private static async fetchLoginCaptcha(
    apiContext: Awaited<ReturnType<typeof request.newContext>>,
    csrfToken: string,
  ): Promise<{ captchaId: string; captcha: string } | null> {
    let lastStatus = 0;
    let lastRaw = "";

    for (const captchaPath of this.candidatePaths(this.captchaPath)) {
      const response = await apiContext.get(captchaPath, {
        headers: this.buildAuthHeaders(csrfToken),
      });
      lastStatus = response.status();
      lastRaw = await response.text();
      if (this.isRouteNotFound(lastStatus)) {
        LoggerEngine.info(`CAPTCHA GET ${captchaPath} returned 404; trying next path`);
        continue;
      }
      if (captchaPath === this.captchaPath.slice("/indore".length) || captchaPath === "/auth/captcha") {
        enableStripIndorePrefix();
      }
      if (!response.ok()) {
        throw new Error(
          `Login CAPTCHA GET failed with status ${lastStatus} - ${lastRaw.slice(0, 300)}`,
        );
      }

      let body: unknown;
      try {
        body = JSON.parse(lastRaw) as unknown;
      } catch {
        throw new Error(
          `Login CAPTCHA GET returned non-JSON - ${lastRaw.slice(0, 300)}`,
        );
      }

      const { captchaId, text, svg } = this.unwrapLoginCaptcha(body);
      if (!captchaId?.trim()) {
        throw new Error("Login CAPTCHA GET did not include captchaId");
      }
      if (text?.trim()) {
        const captcha = text.trim();
        this.printCaptchaAnswer(captcha, "api-text");
        return { captchaId, captcha };
      }
      if (svg?.trim()) {
        const captcha = await solveCaptchaSvg(svg);
        this.printCaptchaAnswer(captcha, "ocr");
        return { captchaId, captcha };
      }
      LoggerEngine.info(
        "CAPTCHA GET had captchaId but no text or svg; posting login without captcha fields",
      );
      return null;
    }

    LoggerEngine.info(
      `Login CAPTCHA route not found (last status ${lastStatus}); posting login without captcha fields`,
    );
    return null;
  }

  private static printCaptchaAnswer(captcha: string, source: "api-text" | "ocr"): void {
    const line = `Login CAPTCHA (${source}): ${captcha}`;
    LoggerEngine.info(line);
    // stderr: Playwright globalSetup often hides stdout; this still shows in the terminal.
    console.error(line);
  }

  private static buildAuthHeaders(csrfToken: string): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (csrfToken.trim()) {
      headers["x-csrf-token"] = csrfToken;
    }
    return headers;
  }

  private static extractAccessToken(responseBody: {
    data?: { accessToken?: string; expiresIn?: number; requiresDeviceSelection?: boolean };
  }): Pick<LoginResponse, "accessToken" | "expiresIn"> {
    const accessToken = responseBody.data?.accessToken;
    if (!accessToken) {
      throw new Error("Login response did not include an access token");
    }

    return {
      accessToken,
      expiresIn: responseBody.data?.expiresIn ?? 900
    };
  }

  private static async toLoginResponse(
    apiContext: Awaited<ReturnType<typeof request.newContext>>,
    responseBody: Parameters<typeof AuthApi.extractAccessToken>[0]
  ): Promise<LoginResponse> {
    const session = this.extractAccessToken(responseBody);
    const storageState = await this.snapshotCookies(apiContext);
    if (this.lastStorageState) {
      this.persistStorageState(this.lastStorageState);
    }
    return {
      ...session,
      csrfToken: this.readCsrfToken(storageState.cookies, {}),
    };
  }

  private static async fetchCsrf(
    apiContext: Awaited<ReturnType<typeof request.newContext>>,
  ): Promise<string> {
    const preflightPaths = Array.from(
      new Set([this.path(this.loginPath), "/auth/login", "/indore/auth/login"]),
    );
    let lastStatus = 0;
    let lastPath = preflightPaths[0];
    let sawGatewayError = false;

    for (const preflightPath of preflightPaths) {
      lastPath = preflightPath;
      const response = await apiContext.get(preflightPath);
      lastStatus = response.status();
      await response.text();

      const fromGet = this.readCsrfToken(
        (await this.snapshotCookies(apiContext, response.headers())).cookies,
        response.headers(),
      );
      if (fromGet) {
        return fromGet;
      }

      if (this.retriablePreflightStatuses.has(lastStatus)) {
        sawGatewayError = true;
        LoggerEngine.info(`CSRF GET ${preflightPath} returned ${lastStatus}`);
      }
    }

    const postProbe = await apiContext.post(this.path(this.loginPath), {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: {},
    });
    lastStatus = postProbe.status();
    await postProbe.text();
    const fromPost = this.readCsrfToken(
      (await this.snapshotCookies(apiContext, postProbe.headers())).cookies,
      postProbe.headers(),
    );
    if (fromPost) {
      return fromPost;
    }

    if (sawGatewayError || this.retriablePreflightStatuses.has(lastStatus)) {
      LoggerEngine.info(
        `CSRF preflight unavailable (last GET/POST ${lastStatus} on ${lastPath}); logging in without csrf cookie`,
      );
      return "";
    }

    LoggerEngine.info(
      `No csrf cookie after GET/POST preflight (last status ${lastStatus}); logging in without it`,
    );
    return "";
  }

  static async refresh(accessToken: string): Promise<LoginResponse> {
    const apiContext = await this.createContext(true);

    try {
      const csrfToken = await this.fetchCsrf(apiContext);
      const startTime = Date.now();

      const response = await apiContext.post(this.path(this.refreshPath), {
        headers: {
          ...this.buildAuthHeaders(csrfToken),
          Authorization: `Bearer ${accessToken}`
        }
      });

      const responseBody = await response.json();

      LoggerEngine.api({
        method: "POST",
        url: this.path(this.refreshPath),
        status: response.status(),
        responseTimeMs: Date.now() - startTime
      });

      if (!response.ok()) {
        throw new Error(
          `Token refresh failed with status ${response.status()} - ${JSON.stringify(responseBody)}`
        );
      }

      return this.toLoginResponse(apiContext, responseBody);
    } catch (error) {
      LoggerEngine.error("AuthApi.refresh failed", error);
      throw error;
    } finally {
      await apiContext.dispose();
    }
  }

  private static isCaptchaRequired(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /CAPTCHA_REQUIRED/i.test(message);
  }

  private static isInvalidCaptcha(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /INVALID_CAPTCHA/i.test(message);
  }

  private static captchaLockoutError(cause: string): Error {
    return new Error(
      `${cause} Login is locked until captcha cooldown clears. ` +
        "Wait 5–10 minutes without re-running npm test (repeated POSTs extend the lock). " +
        "This is the auth API, not a dashboard test failure.",
    );
  }

  private static isDbBusyError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /DB_BUSY|database is busy|please retry shortly|temporarily unavailable|SERVICE_UNAVAILABLE/i.test(
      message,
    );
  }

  private static isRetriableLoginError(error: unknown): boolean {
    const message =
      error instanceof Error ? error.message : String(error);

    if (this.isDbBusyError(error)) {
      return true;
    }

    if (this.retriableAuthStatuses.has(Number(message.match(/status (\d+)/)?.[1]))) {
      return true;
    }

    return (
      message.includes("did not include an access token") ||
      message.includes("Login succeeded but no access token was returned") ||
      message.includes("Device selection required but login response was incomplete") ||
      message.includes("Device selection succeeded but no access token was returned") ||
      message.includes("Device selection exhausted all release attempts") ||
      message.includes("2FA required but TOTP_SECRET is not set") ||
      message.includes("2FA verification did not return an access token") ||
      message.includes("CSRF preflight unavailable") ||
      message.includes("CSRF token missing")
    );
  }

  private static pickDevicesToTerminate(
    devices: DeviceSelectionDevice[],
  ): DeviceSelectionDevice[] {
    const keepDeviceId = process.env.DEVICE_ID?.trim();
    const sorted = [...devices].sort((left, right) => {
      const leftTime = Date.parse(left.lastSeenAt ?? "") || 0;
      const rightTime = Date.parse(right.lastSeenAt ?? "") || 0;
      return leftTime - rightTime;
    });

    if (!keepDeviceId) {
      return sorted;
    }

    const releasable = sorted.filter((device) => device.id !== keepDeviceId);
    return releasable.length > 0 ? releasable : sorted;
  }

  private static pickDeviceToRelease(
    devices: DeviceSelectionDevice[],
  ): DeviceSelectionDevice {
    return this.pickDevicesToTerminate(devices)[0] ?? devices[0]!;
  }

  private static flattenCatalogDevices(body: {
    data?: {
      devices?: Array<{ id?: string; isCurrentDevice?: boolean; revokedAt?: string | null }>;
      deviceGroups?: Array<{
        devices?: Array<{ id?: string; isCurrentDevice?: boolean; revokedAt?: string | null }>;
      }>;
    };
  }): Array<{ id: string; isCurrentDevice?: boolean; revokedAt?: string | null }> {
    const data = body.data ?? {};
    const fromRoot = Array.isArray(data.devices) ? data.devices : [];
    const fromGroups = Array.isArray(data.deviceGroups)
      ? data.deviceGroups.flatMap((group) =>
          Array.isArray(group.devices) ? group.devices : [],
        )
      : [];
    const seen = new Set<string>();
    const merged: Array<{
      id: string;
      isCurrentDevice?: boolean;
      revokedAt?: string | null;
    }> = [];
    for (const device of [...fromRoot, ...fromGroups]) {
      const id = device.id?.trim();
      if (!id || seen.has(id)) {
        continue;
      }
      seen.add(id);
      merged.push(device as { id: string; isCurrentDevice?: boolean; revokedAt?: string | null });
    }
    return merged;
  }

  /** After a device-limit login, revoke every other session so the cap of 4 does not block the next run. */
  private static async revokeOtherSessions(
    apiContext: Awaited<ReturnType<typeof request.newContext>>,
    session: LoginResponse,
  ): Promise<void> {
    const listResponse = await apiContext.get(this.path(this.devicesPath), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
    });
    if (!listResponse.ok()) {
      LoggerEngine.info(
        `Could not list sessions to terminate (${listResponse.status()}); continuing with current login`,
      );
      return;
    }

    const listBody = (await listResponse.json()) as {
      data?: {
        devices?: Array<{ id?: string; isCurrentDevice?: boolean; revokedAt?: string | null }>;
        deviceGroups?: Array<{
          devices?: Array<{ id?: string; isCurrentDevice?: boolean; revokedAt?: string | null }>;
        }>;
      };
    };
    const keepDeviceId = process.env.DEVICE_ID?.trim();
    const targets = this.flattenCatalogDevices(listBody).filter((device) => {
      if (device.isCurrentDevice || device.revokedAt) {
        return false;
      }
      if (keepDeviceId && device.id === keepDeviceId) {
        return false;
      }
      return true;
    });

    for (const device of targets) {
      const csrfToken = this.readCsrfToken(
        (await this.snapshotCookies(apiContext)).cookies,
        {},
      );
      const deleted = await apiContext.delete(
        this.path(`${this.devicesPath}/${device.id}`),
        {
          headers: {
            ...this.buildAuthHeaders(csrfToken),
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );
      LoggerEngine.info(
        `Terminated session ${device.id} (${deleted.status()}) after device-limit login`,
      );
    }
  }

  private static async completeTwoFactor(
    apiContext: Awaited<ReturnType<typeof request.newContext>>,
    initialBody: TwoFactorBody,
    responseHeaders: Record<string, string>,
  ): Promise<TwoFactorBody> {
    const challengeToken = initialBody.challengeToken?.trim();
    const totpSecret = getTotpSecret();
    if (!challengeToken) {
      throw new Error("2FA required but login response was missing challengeToken");
    }
    if (!totpSecret) {
      throw new Error(
        "2FA required but TOTP_SECRET is not set — add the authenticator base32 secret to .env",
      );
    }

    let lastError = "2FA verification failed";
    for (const periodOffset of [0, -1, 1]) {
      const csrfToken = this.readCsrfToken(
        (await this.snapshotCookies(apiContext, responseHeaders)).cookies,
        responseHeaders,
      );
      const otp = generateTotp(totpSecret, periodOffset);
      const startTime = Date.now();
      let verifyResponse: Awaited<ReturnType<typeof apiContext.post>> | undefined;
      let verifyPathUsed = this.path(this.login2faPath);
      let verifyBody: { data?: TwoFactorBody; error?: { code?: string } } = {};

      for (const verifyPath of this.candidatePaths(this.login2faPath)) {
        verifyPathUsed = verifyPath;
        verifyResponse = await apiContext.post(verifyPath, {
          headers: this.buildAuthHeaders(csrfToken),
          data: { challengeToken, otp },
        });
        verifyBody = (await verifyResponse.json().catch(() => ({}))) as typeof verifyBody;
        if (!this.isRouteNotFound(verifyResponse.status())) {
          if (verifyPath === "/auth/login/2fa") {
            enableStripIndorePrefix();
          }
          break;
        }
      }

      if (!verifyResponse) {
        throw new Error("2FA verification failed: no path was attempted");
      }

      LoggerEngine.api({
        method: "POST",
        url: verifyPathUsed,
        status: verifyResponse.status(),
        responseTimeMs: Date.now() - startTime,
      });

      if (verifyResponse.ok() && verifyBody.data) {
        return verifyBody.data;
      }

      lastError = `2FA verification failed with status ${verifyResponse.status()} - ${JSON.stringify(verifyBody)}`;
      const code = (verifyBody as { error?: { code?: string } }).error?.code ?? "";
      if (code === "TWO_FACTOR_SECRET_UNAVAILABLE") {
        const host = (() => {
          try {
            return new URL(normalizeApiBaseUrl(process.env.BASE_URL)).hostname;
          } catch {
            return "this API";
          }
        })();
        throw new Error(
          host === "localhost" || host === "127.0.0.1"
            ? `TWO_FACTOR_SECRET_UNAVAILABLE on ${host}: this local user has 2FA on, but the local API cannot decrypt the stored secret. Disable 2FA for this account in the local DB, or re-enroll 2FA on localhost and put that new base32 secret in TOTP_SECRET. Do not use a live-dashboard TOTP_SECRET against localhost.`
            : `TWO_FACTOR_SECRET_UNAVAILABLE on ${host}: password login worked, but the API cannot decrypt this user's stored 2FA secret. TOTP_SECRET only generates the 6-digit code. Re-enroll 2FA on that environment and put the new base32 secret in TOTP_SECRET, or turn 2FA off for the test user.`,
        );
      }
    }

    throw new Error(lastError);
  }

  private static async completeDeviceSelection(
    apiContext: Awaited<ReturnType<typeof request.newContext>>,
    initialBody: DeviceSelectionBody,
    responseHeaders: Record<string, string>,
  ): Promise<DeviceSelectionBody> {
    let challengeToken = initialBody.challengeToken;
    let devices = initialBody.devices ?? [];

    if (!challengeToken || devices.length === 0) {
      throw new Error("Device selection required but login response was incomplete");
    }

    LoggerEngine.info(
      `Device limit reached (${devices.length} active sessions). Terminating listed sessions so login can continue.`,
    );
    console.log(
      `Device limit reached (${devices.length} sessions). Closing all listed sessions.`,
    );

    const maxAttempts = Math.max(devices.length, 4) + 2;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const toTerminate = this.pickDevicesToTerminate(devices);
      const deviceToRelease = toTerminate[0] ?? devices[0];
      if (!deviceToRelease) {
        throw new Error("Device selection required but no session was available to terminate");
      }

      const csrfToken = this.readCsrfToken(
        (await this.snapshotCookies(apiContext, responseHeaders)).cookies,
        responseHeaders,
      );

      const releaseStartTime = Date.now();
      const releaseResponse = await apiContext.post(this.path(this.releaseDevicePath), {
        headers: this.buildAuthHeaders(csrfToken),
        data: { challengeToken, deviceId: deviceToRelease.id },
      });

      const releaseBody = (await releaseResponse.json()) as {
        data?: DeviceSelectionBody;
      };

      LoggerEngine.api({
        method: "POST",
        url: this.path(this.releaseDevicePath),
        status: releaseResponse.status(),
        responseTimeMs: Date.now() - releaseStartTime,
      });

      if (!releaseResponse.ok()) {
        throw new Error(
          `Device selection failed with status ${releaseResponse.status()} - ${JSON.stringify(releaseBody)}`,
        );
      }

      const data = releaseBody.data;
      if (data?.accessToken) {
        return data;
      }

      if (data?.requires2FA) {
        LoggerEngine.info(
          "Device slot freed; API now requires 2FA before issuing a token",
        );
        console.log("Device slot freed. Completing 2FA next.");
        return data;
      }

      if (!data?.requiresDeviceSelection) {
        throw new Error(
          `Device selection succeeded but no access token was returned - ${JSON.stringify(releaseBody)}`,
        );
      }

      challengeToken = data.challengeToken;
      devices = data.devices ?? [];

      if (!challengeToken || devices.length === 0) {
        throw new Error(
          `Device selection challenge incomplete after release attempt ${attempt + 1}`,
        );
      }

      LoggerEngine.info(
        `Terminated session ${deviceToRelease.id} (${attempt + 1}/${maxAttempts}); ${devices.length} still active`,
      );
    }

    throw new Error("Device selection exhausted all release attempts");
  }

  private static async loginOnce(credentials?: {
    email: string;
    password: string;
  }): Promise<LoginResponse> {
    const email =
      credentials?.email ?? process.env.EMAIL ?? process.env.USERNAME;
    const password = credentials?.password ?? process.env.PASSWORD;

    if (!email || !password) {
      throw new Error("Missing EMAIL (or USERNAME) and PASSWORD environment variables");
    }

    const apiContext = await this.createContext();
    this.lastStorageState = null;

    try {
      const startTime = Date.now();
      const csrfToken = await this.fetchCsrf(apiContext);

      let loginResponse: Awaited<ReturnType<typeof apiContext.post>> | undefined;
      let loginRaw = "";
      let loginPathUsed = this.path(this.loginPath);
      let loginBody: {
        data?: TwoFactorBody & { accessToken?: string; expiresIn?: number };
        error?: { code?: string; message?: string };
      } = {};
      let lastCaptchaGuess = "";

      for (
        let captchaAttempt = 1;
        captchaAttempt <= this.captchaOcrMaxAttempts;
        captchaAttempt += 1
      ) {
        const loginCaptcha = await this.fetchLoginCaptcha(apiContext, csrfToken);
        lastCaptchaGuess = loginCaptcha?.captcha ?? "";

        loginResponse = undefined;
        loginRaw = "";
        loginPathUsed = this.path(this.loginPath);

        for (const loginPath of this.candidatePaths(this.loginPath)) {
          loginPathUsed = loginPath;
          loginResponse = await apiContext.post(loginPath, {
            headers: this.buildAuthHeaders(csrfToken),
            data: {
              email,
              password,
              ...(loginCaptcha
                ? {
                    captchaId: loginCaptcha.captchaId,
                    captcha: loginCaptcha.captcha,
                  }
                : {}),
            },
          });
          loginRaw = await loginResponse.text();
          if (!this.isRouteNotFound(loginResponse.status())) {
            if (loginPath === this.loginPath.slice("/indore".length) || loginPath === "/auth/login") {
              enableStripIndorePrefix();
            }
            break;
          }
          LoggerEngine.info(`Login POST ${loginPath} returned 404; trying next path`);
        }

        if (!loginResponse) {
          throw new Error("Login failed: no login path was attempted");
        }

        if (this.retriableAuthStatuses.has(loginResponse.status())) {
          throw new Error(
            `Login failed with status ${loginResponse.status()} - ${loginRaw.slice(0, 300)}`,
          );
        }

        try {
          loginBody = JSON.parse(loginRaw) as typeof loginBody;
        } catch {
          throw new Error(
            `Login failed with status ${loginResponse.status()} - ${loginRaw.slice(0, 300)}`,
          );
        }

        LoggerEngine.api({
          method: "POST",
          url: loginPathUsed,
          status: loginResponse.status(),
          responseTimeMs: Date.now() - startTime,
          attempt: captchaAttempt,
        });

        const invalidCaptcha =
          loginResponse.status() === 401 &&
          /INVALID_CAPTCHA/i.test(JSON.stringify(loginBody));

        LoggerEngine.debug(
          `CAPTCHA attempt ${captchaAttempt}/${this.captchaOcrMaxAttempts} guess=${lastCaptchaGuess || "(none)"} result=${
            invalidCaptcha ? "INVALID_CAPTCHA" : loginResponse.ok() ? "ok" : `status ${loginResponse.status()}`
          }`,
        );
        console.error(
          `Login CAPTCHA attempt ${captchaAttempt}/${this.captchaOcrMaxAttempts}: ${lastCaptchaGuess || "(none)"} → ${
            invalidCaptcha ? "INVALID_CAPTCHA" : loginResponse.ok() ? "accepted" : `status ${loginResponse.status()}`
          }`,
        );

        if (invalidCaptcha && captchaAttempt < this.captchaOcrMaxAttempts) {
          continue;
        }

        if (!loginResponse.ok()) {
          const loginError = new Error(
            `Login failed with status ${loginResponse.status()} - ${JSON.stringify(loginBody)}`,
          );
          if (invalidCaptcha) {
            throw new Error(
              `Login failed after ${this.captchaOcrMaxAttempts} CAPTCHA attempt(s). ${loginError.message}`,
            );
          }
          if (this.isCaptchaRequired(loginError)) {
            throw this.captchaLockoutError(loginError.message);
          }
          throw loginError;
        }

        break;
      }

      if (!loginResponse) {
        throw new Error("Login failed: no login path was attempted");
      }

      if (loginBody.data?.accessToken) {
        return this.toLoginResponse(apiContext, loginBody);
      }

      let nextBody = loginBody.data as TwoFactorBody;
      const headers = loginResponse.headers();

      for (let step = 0; step < 8; step += 1) {
        if (nextBody?.accessToken) {
          return this.toLoginResponse(apiContext, { data: nextBody });
        }

        if (nextBody?.requires2FA) {
          nextBody = await this.completeTwoFactor(apiContext, nextBody, headers);
          continue;
        }

        if (nextBody?.requiresDeviceSelection) {
          nextBody = await this.completeDeviceSelection(
            apiContext,
            nextBody as DeviceSelectionBody,
            headers,
          );
          continue;
        }

        throw new Error(
          `Login succeeded but no access token was returned - ${JSON.stringify({ data: nextBody })}`,
        );
      }

      throw new Error("Login did not return an access token after 2FA/device steps");
    } finally {
      await apiContext.dispose();
    }
  }

  static async login(credentials?: {
    email: string;
    password: string;
  }): Promise<LoginResponse> {
    let lastError: Error | null = null;
    let sawDbBusy = false;

    for (let attempt = 0; attempt < this.loginRetryMs.length; attempt += 1) {
      const waitMs = this.loginRetryMs[attempt] ?? 0;
      if (waitMs > 0) {
        const msg =
          `Login retry ${attempt + 1}/${this.loginRetryMs.length} after ${waitMs}ms` +
          (sawDbBusy ? " (DB_BUSY backoff)" : "");
        LoggerEngine.info(msg);
        console.log(msg);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }

      try {
        return await this.loginOnce(credentials);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (this.isCaptchaRequired(lastError)) {
          const waitMs = this.captchaRetryWaitMs;
          const msg = `Login CAPTCHA_REQUIRED — waiting ${waitMs / 1000}s once, then one retry`;
          LoggerEngine.info(msg);
          console.log(msg);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          try {
            return await this.loginOnce(credentials);
          } catch (retryError) {
            const failed =
              retryError instanceof Error ? retryError : new Error(String(retryError));
            LoggerEngine.error("AuthApi.login failed", failed);
            throw this.isCaptchaRequired(failed)
              ? this.captchaLockoutError(failed.message)
              : failed;
          }
        }

        if (!this.isRetriableLoginError(lastError)) {
          LoggerEngine.error("AuthApi.login failed", lastError);
          throw lastError;
        }

        if (this.isDbBusyError(lastError)) {
          sawDbBusy = true;
          const finding =
            "BACKEND FINDING: login returned DB_BUSY — retrying while database recovers";
          LoggerEngine.info(finding);
          console.log(finding);
        }

        const failMsg = `Login attempt ${attempt + 1}/${this.loginRetryMs.length} failed (retriable): ${lastError.message}`;
        LoggerEngine.info(failMsg);
        console.log(failMsg);
      }
    }

    LoggerEngine.error("AuthApi.login failed after retries", lastError);
    throw (
      lastError ??
      new Error(
        sawDbBusy
          ? "Login failed after DB_BUSY retries — database still busy; retry the suite shortly"
          : "Login failed after retries",
      )
    );
  }

  static async loginAs(email: string, password: string): Promise<LoginResponse> {
    return this.login({ email, password });
  }
}
