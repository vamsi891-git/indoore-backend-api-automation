import { APIRequestContext } from "@playwright/test";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { AuthPaths } from "../Data/auth.data";
import { AuthMapper } from "../Mapper/auth.mapper";
import {
  AuthLoginSuccessResponseSchema,
  isDeviceSelectionPayload,
  type AuthLoginSession,
} from "../schemas/auth.schemas";

export interface EstablishedAuthSession extends AuthLoginSession {
  csrfToken: string;
}

export class AuthenticationApi {
  constructor(private readonly request: APIRequestContext) {}

  private buildCsrfHeaders(csrfToken: string): Record<string, string> {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    };
  }

  async getLoginPreflight(): Promise<ApiCallResult> {
    const start = Date.now();
    const rawResponse = await this.request.get(AuthPaths.login);
    const responseBody = await rawResponse.json().catch(() => ({}));
    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }

  async postLogin(
    email: string,
    password: string,
    csrfToken: string,
  ): Promise<ApiCallResult> {
    const start = Date.now();
    const rawResponse = await this.request.post(AuthPaths.login, {
      headers: this.buildCsrfHeaders(csrfToken),
      data: { email, password },
    });
    const responseBody = await rawResponse.json();
    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }

  async postReleaseDevice(
    challengeToken: string,
    deviceId: string,
    csrfToken: string,
  ): Promise<ApiCallResult> {
    const start = Date.now();
    const rawResponse = await this.request.post(AuthPaths.releaseDevice, {
      headers: this.buildCsrfHeaders(csrfToken),
      data: { challengeToken, deviceId },
    });
    const responseBody = await rawResponse.json();
    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }

  /** Refresh uses httpOnly refresh cookie set during login — not Bearer access token. */
  async postRefreshWithCookies(csrfToken: string): Promise<ApiCallResult> {
    const start = Date.now();
    const rawResponse = await this.request.post(AuthPaths.refresh, {
      headers: this.buildCsrfHeaders(csrfToken),
    });
    const responseBody = await rawResponse.json();
    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }

  /**
   * Logs in within this request context so refresh cookies are available.
   * Completes device-selection release when the account is at the device limit.
   */
  async loginUntilSession(
    email: string,
    password: string,
  ): Promise<EstablishedAuthSession> {
    await this.getLoginPreflight();
    let csrfToken = await AuthMapper.resolveCsrfToken(this.request, {});

    let login = await this.postLogin(email, password, csrfToken);
    if (login.rawResponse.status() !== 200) {
      throw new Error(
        `Login failed with status ${login.rawResponse.status()}: ${JSON.stringify(login.responseBody)}`,
      );
    }

    let parsed = AuthLoginSuccessResponseSchema.parse(login.responseBody);
    const maxAttempts = isDeviceSelectionPayload(parsed.data)
      ? parsed.data.devices.length + 2
      : 2;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (AuthMapper.hasDirectSession(parsed.data)) {
        const freshCsrf = await AuthMapper.resolveCsrfToken(this.request, {});
        return {
          accessToken: parsed.data.accessToken,
          expiresIn: parsed.data.expiresIn ?? 900,
          csrfToken: freshCsrf,
        };
      }

      const selection = AuthMapper.mapDeviceSelection(parsed.data);
      if (!selection) {
        break;
      }

      const keepDeviceId = process.env.DEVICE_ID?.trim();
      const sorted = [...selection.devices].sort((left, right) => {
        const leftTime = Date.parse(left.lastSeenAt ?? "") || 0;
        const rightTime = Date.parse(right.lastSeenAt ?? "") || 0;
        return leftTime - rightTime;
      });
      const releasable = keepDeviceId
        ? sorted.filter((device) => device.id !== keepDeviceId)
        : sorted;
      const deviceToRelease = releasable[0] ?? sorted[0];

      csrfToken = await AuthMapper.resolveCsrfToken(this.request, {});
      const release = await this.postReleaseDevice(
        selection.challengeToken,
        deviceToRelease.id,
        csrfToken,
      );

      if (release.rawResponse.status() !== 200) {
        throw new Error(
          `Device release failed: ${JSON.stringify(release.responseBody)}`,
        );
      }

      parsed = AuthLoginSuccessResponseSchema.parse(release.responseBody);
    }

    throw new Error("Login did not return a session after device selection");
  }
}
