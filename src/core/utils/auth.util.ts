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

export class AuthApi {
  private static readonly loginPath = "/indore/auth/login";
  private static readonly refreshPath = "/indore/auth/refresh";
  private static readonly releaseDevicePath = "/indore/auth/login/release-device";

  private static async createContext() {
    return request.newContext({ baseURL: process.env.BASE_URL });
  }

  private static getCsrfToken(cookies: AuthCookie[]): string {
    const csrfToken = cookies.find((cookie) => cookie.name === "csrf_token")?.value;
    if (!csrfToken) {
      throw new Error("CSRF token cookie missing from auth preflight response");
    }
    return csrfToken;
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
    const csrfToken = this.getCsrfToken((await apiContext.storageState()).cookies);

    return {
      ...session,
      csrfToken
    };
  }

  private static async fetchCsrf(apiContext: Awaited<ReturnType<typeof request.newContext>>): Promise<string> {
    await apiContext.get(this.loginPath);
    return this.getCsrfToken((await apiContext.storageState()).cookies);
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

  static async login(): Promise<LoginResponse> {
    const email = process.env.EMAIL ?? process.env.USERNAME;
    const password = process.env.PASSWORD;

    if (!email || !password) {
      throw new Error("Missing EMAIL (or USERNAME) and PASSWORD environment variables");
    }

    const apiContext = await this.createContext();

    try {
      const startTime = Date.now();
      let csrfToken = await this.fetchCsrf(apiContext);

      const loginResponse = await apiContext.post(this.loginPath, {
        headers: this.buildAuthHeaders(csrfToken),
        data: { email, password }
      });

      const loginBody = await loginResponse.json();

      LoggerEngine.api({
        method: "POST",
        url: this.loginPath,
        status: loginResponse.status(),
        responseTimeMs: Date.now() - startTime
      });

      if (!loginResponse.ok()) {
        throw new Error(
          `Login failed with status ${loginResponse.status()} - ${JSON.stringify(loginBody)}`
        );
      }

      if (loginBody.data?.accessToken) {
        return this.toLoginResponse(apiContext, loginBody);
      }

      if (loginBody.data?.requiresDeviceSelection) {
        const challengeToken = loginBody.data.challengeToken as string | undefined;
        const devices = loginBody.data.devices as Array<{ id: string }> | undefined;

        if (!challengeToken || !devices?.length) {
          throw new Error("Device selection required but login response was incomplete");
        }

        const configuredDeviceId = process.env.DEVICE_ID?.trim();
        const selectedDevice =
          devices.find((device) => device.id === configuredDeviceId) ?? devices[0];

        csrfToken = this.getCsrfToken((await apiContext.storageState()).cookies);

        const releaseStartTime = Date.now();
        const releaseResponse = await apiContext.post(this.releaseDevicePath, {
          headers: this.buildAuthHeaders(csrfToken),
          data: { challengeToken, deviceId: selectedDevice.id }
        });

        const releaseBody = await releaseResponse.json();

        LoggerEngine.api({
          method: "POST",
          url: this.releaseDevicePath,
          status: releaseResponse.status(),
          responseTimeMs: Date.now() - releaseStartTime
        });

        if (!releaseResponse.ok()) {
          throw new Error(
            `Device selection failed with status ${releaseResponse.status()} - ${JSON.stringify(releaseBody)}`
          );
        }

        return this.toLoginResponse(apiContext, releaseBody);
      }

      throw new Error(
        `Login succeeded but no access token was returned - ${JSON.stringify(loginBody)}`
      );
    } catch (error) {
      LoggerEngine.error("AuthApi.login failed", error);
      throw error;
    } finally {
      await apiContext.dispose();
    }
  }
}
