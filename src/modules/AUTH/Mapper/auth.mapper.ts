import { APIRequestContext } from "@playwright/test";
import {
  AuthLoginData,
  AuthLoginSession,
  isDeviceSelectionPayload,
  isLoginSessionPayload,
} from "../schemas/auth.schemas";

export interface AuthSessionModel {
  accessToken: string;
  expiresIn: number;
  csrfToken: string;
}

export interface DeviceSelectionModel {
  challengeToken: string;
  expiresIn: number;
  maxDevices: number;
  devices: Array<{
    id: string;
    name: string | null;
    deviceType: string | null;
    lastSeenAt: string | null;
  }>;
}

export class AuthMapper {
  static async resolveCsrfToken(
    request: APIRequestContext,
    responseHeaders: Record<string, string> = {},
  ): Promise<string> {
    const cookies = (await request.storageState()).cookies;
    const cookieToken = cookies.find((c) => c.name === "csrf_token")?.value;
    if (cookieToken) {
      return cookieToken;
    }

    const headerToken =
      responseHeaders["x-csrf-token"] ?? responseHeaders["X-CSRF-Token"];
    if (headerToken) {
      return headerToken;
    }

    const cookieNames = cookies.map((c) => c.name).join(", ") || "none";
    throw new Error(
      `CSRF token missing (cookies: ${cookieNames})`,
    );
  }

  static mapLoginSession(
    data: AuthLoginSession,
    csrfToken: string,
  ): AuthSessionModel {
    return {
      accessToken: data.accessToken,
      expiresIn: data.expiresIn ?? 900,
      csrfToken,
    };
  }

  static mapDeviceSelection(data: AuthLoginData): DeviceSelectionModel | null {
    if (!isDeviceSelectionPayload(data)) {
      return null;
    }

    return {
      challengeToken: data.challengeToken,
      expiresIn: data.expiresIn ?? 300,
      maxDevices: data.maxDevices ?? data.devices.length,
      devices: data.devices.map((device) => ({
        id: device.id,
        name: device.name ?? null,
        deviceType: device.deviceType ?? null,
        lastSeenAt: device.lastSeenAt ?? null,
      })),
    };
  }

  static hasDirectSession(data: AuthLoginData): data is AuthLoginSession {
    return isLoginSessionPayload(data);
  }
}
