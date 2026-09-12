import { request } from "@playwright/test";
import { LoggerEngine } from "../engine/logger.engine";
import {
  enableStripIndorePrefix,
  resolveApiPath,
  normalizeApiBaseUrl,
} from "./api-path.util";
import { generateTotp, getTotpSecret } from "./totp.util";

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
  private static readonly login2faPath = "/indore/auth/login/2fa";
  private static readonly refreshPath = "/indore/auth/refresh";
  private static readonly releaseDevicePath = "/indore/auth/login/release-device";
  private static readonly devicesPath = "/indore/auth/devices";
  /**
   * Login backoff including room for API `DB_BUSY` (503) pool contention.
   * Total wait ≈ 2.8 minutes across attempts before failing global setup.
   */
  private static readonly loginRetryMs = [
    0, 5_000, 10_000, 20_000, 30_000, 45_000, 60_000,
  ];
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

  private static async createContext() {
    return request.newContext({
      baseURL: normalizeApiBaseUrl(process.env.BASE_URL),
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: {
        Accept: "application/json",
        "User-Agent":
          process.env.API_USER_AGENT?.trim() ||
          "Mozilla/5.0 (compatible; IndooreAPITests/1.0)",
      },
    });
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
    const storageState = await apiContext.storageState();
    const csrfToken = this.readCsrfToken(storageState.cookies, {});

    return {
      ...session,
      csrfToken
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
        (await apiContext.storageState()).cookies,
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
      (await apiContext.storageState()).cookies,
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
    const apiContext = await this.createContext();

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

  private static isDbBusyError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /DB_BUSY|database is busy|please retry shortly/i.test(message);
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
        (await apiContext.storageState()).cookies,
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
        (await apiContext.storageState()).cookies,
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
          `TWO_FACTOR_SECRET_UNAVAILABLE on ${host}: password login worked, but the API cannot decrypt this user's stored 2FA secret. ` +
            "TOTP_SECRET only generates the 6-digit code; it cannot fix a missing secret on the server. " +
            "On https://mdm.mppkvvcl.bestinfra.app turn 2FA off for the CI user, or re-enroll 2FA there and put the new base32 secret in GitHub secret TOTP_SECRET. " +
            "A local/.env TOTP_SECRET from another environment will not work if live never stored that enrollment.",
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
        (await apiContext.storageState()).cookies,
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

    try {
      const startTime = Date.now();
      const csrfToken = await this.fetchCsrf(apiContext);

      let loginResponse: Awaited<ReturnType<typeof apiContext.post>> | undefined;
      let loginRaw = "";
      let loginPathUsed = this.path(this.loginPath);

      for (const loginPath of this.candidatePaths(this.loginPath)) {
        loginPathUsed = loginPath;
        loginResponse = await apiContext.post(loginPath, {
          headers: this.buildAuthHeaders(csrfToken),
          data: { email, password },
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

      let loginBody: {
        data?: TwoFactorBody & { accessToken?: string; expiresIn?: number };
      };
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
      });

      if (!loginResponse.ok()) {
        throw new Error(
          `Login failed with status ${loginResponse.status()} - ${JSON.stringify(loginBody)}`,
        );
      }

      if (loginBody.data?.accessToken) {
        return this.toLoginResponse(apiContext, loginBody);
      }

      let nextBody = loginBody.data as TwoFactorBody;
      const headers = loginResponse.headers();
      let hitDeviceLimit = false;

      for (let step = 0; step < 8; step += 1) {
        if (nextBody?.accessToken) {
          const login = await this.toLoginResponse(apiContext, { data: nextBody });
          if (hitDeviceLimit) {
            await this.revokeOtherSessions(apiContext, login);
          }
          return login;
        }

        if (nextBody?.requires2FA) {
          nextBody = await this.completeTwoFactor(apiContext, nextBody, headers);
          continue;
        }

        if (nextBody?.requiresDeviceSelection) {
          hitDeviceLimit = true;
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
