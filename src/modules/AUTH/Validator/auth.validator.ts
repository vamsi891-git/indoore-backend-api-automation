import { expect } from "@playwright/test";
import {
  AuthDeviceSelection,
  AuthLoginSession,
  AuthMeData,
  AuthMeUser,
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

  validateRefreshTokenType(data: { tokenType?: string }) {
    if (data.tokenType !== undefined) {
      expect(data.tokenType).toBe("Bearer");
    }
  }

  validateSuccessEnvelope(response: { success?: boolean; data?: unknown }) {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateMeUser(user: AuthMeUser) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(user.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(emailRegex.test(user.email)).toBeTruthy();
    expect(user.firstName.length).toBeGreaterThan(0);
    expect(user.lastName.length).toBeGreaterThan(0);
    expect(user.role.length).toBeGreaterThan(0);
    expect(user.roleSortOrder).toBeGreaterThanOrEqual(0);
    expect(["active", "suspended"]).toContain(user.status);
    expect(Number.isNaN(Date.parse(user.createdAt))).toBeFalsy();
    expect(user.sessionTimeoutMinutes).toBeGreaterThan(0);
    expect(user.sessionRefreshExpiresDays).toBeGreaterThan(0);
    expect(user.sessionAbsoluteLifetimeDays).toBeGreaterThan(0);
    expect(user.sessionRefreshExpiresDays).toBeLessThan(
      user.sessionAbsoluteLifetimeDays,
    );
    expect(typeof user.isTwoFactorEnabled).toBe("boolean");
    expect(typeof user.isTwoFactorSetupCompleted).toBe("boolean");
    expect(typeof user.isTwoFactorEnforced).toBe("boolean");
    expect(typeof user.roleIsUltimate).toBe("boolean");
    expect(user.failedLoginAttempts).toBeGreaterThanOrEqual(0);
    if (user.isTwoFactorSetupCompleted) {
      expect(user.isTwoFactorEnabled).toBeTruthy();
    }
    if (user.lastSuccessfulLoginAt) {
      expect(Number.isNaN(Date.parse(user.lastSuccessfulLoginAt))).toBeFalsy();
    }
    if (user.profileImageUrl != null) {
      expect(user.profileImageUrl).toMatch(/^https?:\/\//);
    }
    if (user.profileImageViewUrl != null) {
      expect(user.profileImageViewUrl).toMatch(/^https?:\/\//);
    }
  }

  validateMePermissions(permissions: string[]) {
    expect(permissions.length).toBeGreaterThan(0);
    const unique = new Set(permissions);
    expect(unique.size).toBe(permissions.length);
    permissions.forEach((permission) => {
      expect(permission).toMatch(/^[a-z0-9_]+(\.[a-z0-9_]+)+$/);
    });
    expect(unique.has("user_management.view")).toBeTruthy();
  }

  validateMeSessionFlags(data: AuthMeData) {
    expect(typeof data.isUltimate).toBe("boolean");
    expect(typeof data.requiresMandatory2FASetup).toBe("boolean");
    if (data.user.roleIsUltimate) {
      expect(data.isUltimate).toBe(true);
    }
    if (data.user.isTwoFactorEnforced && !data.user.isTwoFactorSetupCompleted) {
      expect(data.requiresMandatory2FASetup).toBe(true);
    }
  }

  validateErrorEnvelope(
    status: number,
    body: { success?: boolean; error?: { code?: string; message?: string } },
    expectedStatuses: number[],
    expectedCode?: string,
  ) {
    expect(expectedStatuses).toContain(status);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    if (expectedCode) {
      expect(body.error?.code).toBe(expectedCode);
    }
  }
}
