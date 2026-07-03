import { request } from "@playwright/test";
import { LoggerEngine } from "../engine/logger.engine";

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

interface DeviceSelectionBody {
  accessToken?: string;
  expiresIn?: number;
  requiresDeviceSelection?: boolean;
  challengeToken?: string;
  devices?: DeviceSelectionDevice[];
}

export class AuthApi {
  private static readonly loginPath = "/indore/auth/login";
  private static readonly refreshPath = "/indore/auth/refresh";
  private static readonly releaseDevicePath = "/indore/auth/login/release-device";
  private static readonly csrfPreflightRetryMs = [0, 5_000, 10_000, 15_000, 30_000];
  private static readonly loginRetryMs = [0, 3_000, 5_000, 10_000, 15_000, 30_000];
  private static readonly retriablePreflightStatuses = new Set([502, 503, 504]);
  private static readonly retriableAuthStatuses = new Set([429, 502, 503, 504]);

  private static async createContext() {
    return request.newContext({ baseURL: process.env.BASE_URL });
  }

  private static resolveCsrfToken(
    cookies: AuthCookie[],
    headers: Record<string, string>,
  ): string {
    const cookieToken = cookies.find((cookie) => cookie.name === "csrf_token")?.value;
    if (cookieToken) {
      return cookieToken;
    }

    const headerToken =
      headers["x-csrf-token"] ??
      headers["X-CSRF-Token"];

    if (headerToken) {
      return headerToken;
    }

    const cookieNames = cookies.map((cookie) => cookie.name).join(", ") || "none";
    throw new Error(
      `CSRF token missing from auth preflight response (cookies: ${cookieNames})`,
    );
  }

  private static buildAuthHeaders(csrfToken: string): Record<string, string> {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken
    };
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
    const csrfToken = this.resolveCsrfToken(
      storageState.cookies,
      {},
    );

    return {
      ...session,
      csrfToken
    };
  }

  private static async fetchCsrf(
    apiContext: Awaited<ReturnType<typeof request.newContext>>,
  ): Promise<string> {
    const baseUrl = process.env.BASE_URL ?? "unknown";
    let lastStatus = 0;
    let lastBody = "";

    for (const waitMs of this.csrfPreflightRetryMs) {
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }

      const response = await apiContext.get(this.loginPath);
      lastStatus = response.status();
      lastBody = (await response.text()).slice(0, 300);

      const storageState = await apiContext.storageState();

      try {
        return this.resolveCsrfToken(
          storageState.cookies,
          response.headers(),
        );
      } catch (csrfError) {
        if (this.retriablePreflightStatuses.has(lastStatus)) {
          LoggerEngine.info(
            `CSRF preflight retry: GET ${this.loginPath} returned ${lastStatus}`,
          );
          continue;
        }

        const csrfMessage =
          csrfError instanceof Error
            ? csrfError.message
            : "CSRF token missing";

        throw new Error(
          `CSRF preflight GET ${this.loginPath} failed with status ${lastStatus} ` +
            `(BASE_URL=${baseUrl}). ${csrfMessage}. Body: ${lastBody}`,
        );
      }
    }

    throw new Error(
      `CSRF preflight unavailable after ${this.csrfPreflightRetryMs.length} attempts ` +
        `(last status ${lastStatus}, BASE_URL=${baseUrl}). Body: ${lastBody}`,
    );
  }

  static async refresh(accessToken: string): Promise<LoginResponse> {
    const apiContext = await this.createContext();

    try {
      const csrfToken = await this.fetchCsrf(apiContext);
      const startTime = Date.now();

      const response = await apiContext.post(this.refreshPath, {
        headers: {
          ...this.buildAuthHeaders(csrfToken),
          Authorization: `Bearer ${accessToken}`
        }
      });

      const responseBody = await response.json();

      LoggerEngine.api({
        method: "POST",
        url: this.refreshPath,
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

  private static isRetriableLoginError(error: unknown): boolean {
    const message =
      error instanceof Error ? error.message : String(error);

    if (this.retriableAuthStatuses.has(Number(message.match(/status (\d+)/)?.[1]))) {
      return true;
    }

    return (
      message.includes("did not include an access token") ||
      message.includes("Login succeeded but no access token was returned") ||
      message.includes("Device selection required but login response was incomplete") ||
      message.includes("Device selection succeeded but no access token was returned") ||
      message.includes("Device selection exhausted all release attempts") ||
      message.includes("CSRF preflight unavailable") ||
      message.includes("CSRF token missing")
    );
  }

  private static pickDeviceToRelease(
    devices: DeviceSelectionDevice[],
  ): DeviceSelectionDevice {
    const keepDeviceId = process.env.DEVICE_ID?.trim();
    const sorted = [...devices].sort((left, right) => {
      const leftTime = Date.parse(left.lastSeenAt ?? "") || 0;
      const rightTime = Date.parse(right.lastSeenAt ?? "") || 0;
      return leftTime - rightTime;
    });

    const releasable = keepDeviceId
      ? sorted.filter((device) => device.id !== keepDeviceId)
      : sorted;

    return releasable[0] ?? sorted[0]!;
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

    const maxAttempts = devices.length + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const deviceToRelease = this.pickDeviceToRelease(devices);
      const csrfToken = this.resolveCsrfToken(
        (await apiContext.storageState()).cookies,
        responseHeaders,
      );

      const releaseStartTime = Date.now();
      const releaseResponse = await apiContext.post(this.releaseDevicePath, {
        headers: this.buildAuthHeaders(csrfToken),
        data: { challengeToken, deviceId: deviceToRelease.id },
      });

      const releaseBody = (await releaseResponse.json()) as {
        data?: DeviceSelectionBody;
      };

      LoggerEngine.api({
        method: "POST",
        url: this.releaseDevicePath,
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
        `Device release attempt ${attempt + 1}/${maxAttempts} released ${deviceToRelease.id}; continuing selection`,
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
      let csrfToken = await this.fetchCsrf(apiContext);

      const loginResponse = await apiContext.post(this.loginPath, {
        headers: this.buildAuthHeaders(csrfToken),
        data: { email, password },
      });

      const loginBody = await loginResponse.json();

      LoggerEngine.api({
        method: "POST",
        url: this.loginPath,
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

      if (loginBody.data?.requiresDeviceSelection) {
        const session = await this.completeDeviceSelection(
          apiContext,
          loginBody.data as DeviceSelectionBody,
          loginResponse.headers(),
        );

        return this.toLoginResponse(apiContext, { data: session });
      }

      throw new Error(
        `Login succeeded but no access token was returned - ${JSON.stringify(loginBody)}`,
      );
    } finally {
      await apiContext.dispose();
    }
  }

  static async login(credentials?: {
    email: string;
    password: string;
  }): Promise<LoginResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.loginRetryMs.length; attempt += 1) {
      const waitMs = this.loginRetryMs[attempt] ?? 0;
      if (waitMs > 0) {
        LoggerEngine.info(
          `Login retry ${attempt + 1}/${this.loginRetryMs.length} after ${waitMs}ms`,
        );
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

        LoggerEngine.info(
          `Login attempt ${attempt + 1}/${this.loginRetryMs.length} failed (retriable): ${lastError.message}`,
        );
      }
    }

    LoggerEngine.error("AuthApi.login failed after retries", lastError);
    throw lastError ?? new Error("Login failed after retries");
  }

  static async loginAs(email: string, password: string): Promise<LoginResponse> {
    return this.login({ email, password });
  }
}
