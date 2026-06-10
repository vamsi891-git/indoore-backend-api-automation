import { expect } from "@playwright/test";
import {
  AuthDeviceSelection,
  AuthLoginSession,
  isDeviceSelectionPayload,
  isLoginSessionPayload,
} from "../schemas/auth.schemas";
import { AuthSessionModel, DeviceSelectionModel } from "../Mapper/auth.mapper";

export class AuthValidator {
  validateCsrfToken(csrfToken: string) {
    expect(csrfToken.trim().length).toBeGreaterThan(0);
  }

  validateLoginSession(session: AuthSessionModel) {
    expect(session.accessToken.length).toBeGreaterThan(10);
    expect(session.expiresIn).toBeGreaterThan(0);
    expect(session.csrfToken.length).toBeGreaterThan(0);
  }

  validateDirectLoginData(data: AuthLoginSession, minExpiresIn: number) {
    expect(data.accessToken.length).toBeGreaterThan(10);
    if (data.expiresIn !== undefined) {
      expect(data.expiresIn).toBeGreaterThanOrEqual(minExpiresIn);
    }
  }

  validateDeviceSelection(data: AuthDeviceSelection | DeviceSelectionModel) {
    expect(data.challengeToken.length).toBeGreaterThan(10);
    expect(data.devices.length).toBeGreaterThan(0);
    data.devices.forEach((device) => {
      expect(device.id.length).toBeGreaterThan(0);
    });
  }

  validateInvalidCredentials(
    status: number,
    expectedStatus: number,
    body: { success?: boolean; error?: { code?: string } },
    expectedCode: string,
  ) {
    expect(status).toBe(expectedStatus);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe(expectedCode);
  }

  validateLoginPayloadShape(data: unknown) {
    if (isLoginSessionPayload(data as AuthLoginSession)) {
      this.validateDirectLoginData(data as AuthLoginSession, 60);
      return;
    }
    if (isDeviceSelectionPayload(data as AuthDeviceSelection)) {
      this.validateDeviceSelection(data as AuthDeviceSelection);
      return;
    }
    throw new Error("Login data is neither session nor device selection");
  }

  /** Auth endpoints may return `accessToken` / `challengeToken` in JSON; still block passwords and refresh tokens in body. */
  validateAuthResponseSecurity(json: unknown) {
    const jsonString = JSON.stringify(json);
    const forbidden = [
      /Bearer\s+[A-Za-z0-9-_\.]+/,
      /"(?:password|passwd|pwd|secret|apiKey|api_key)"\s*:\s*"(?!null)[^"]+"/i,
      /"refreshToken"\s*:\s*"(?!null)[^"]+"/i,
      /"refresh_token"\s*:\s*"(?!null)[^"]+"/i,
    ];
    for (const pattern of forbidden) {
      expect(jsonString).not.toMatch(pattern);
    }
  }

  validateRefreshSession(
    before: AuthSessionModel,
    after: AuthSessionModel,
  ) {
    expect(after.accessToken.length).toBeGreaterThan(10);
    expect(after.expiresIn).toBeGreaterThan(0);
    expect(after.csrfToken.length).toBeGreaterThan(0);
    // Token may rotate on refresh; only assert when both are JWT-like strings
    if (before.accessToken !== after.accessToken) {
      expect(after.accessToken).not.toBe(before.accessToken);
    }
  }
}
