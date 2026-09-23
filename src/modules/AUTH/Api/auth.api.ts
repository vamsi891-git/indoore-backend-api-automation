import { APIRequestContext } from "@playwright/test";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { AuthPaths } from "../Data/auth.data";
import { AuthMapper } from "../Mapper/auth.mapper";
import { generateTotp, getTotpSecret } from "../../../core/utils/totp.util";
import { solveCaptchaSvg, warmupCaptchaOcr } from "../../../core/utils/captcha-ocr.util";
import {
  AuthLoginSuccessResponseSchema,
  isDeviceSelectionPayload,
  isTwoFactorChallengePayload,
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

  async getLoginCaptcha(): Promise<{ captchaId: string; captcha: string } | undefined> {
    await warmupCaptchaOcr();
    const rawResponse = await this.request.get(AuthPaths.captcha, {
      headers: { Accept: "application/json" },
    });
    const responseBody = (await rawResponse.json().catch(() => ({}))) as {
      data?: { captchaId?: string; text?: string; svg?: string };
      captchaId?: string;
      text?: string;
      svg?: string;
    };
    if (rawResponse.status() === 404) {
      return undefined;
    }
    if (rawResponse.status() !== 200) {
      throw new Error(
        `CAPTCHA GET failed with status ${rawResponse.status()}: ${JSON.stringify(responseBody)}`,
      );
    }
    const nested = responseBody.data ?? responseBody;
    const captchaId = (nested.captchaId ?? "").trim();
    const plaintext = (nested.text ?? "").trim();
    const svg = (nested.svg ?? "").trim();
    if (!captchaId) {
      throw new Error("CAPTCHA GET did not include captchaId");
    }
    if (plaintext) {
      console.error(`Login CAPTCHA (api-text): ${plaintext}`);
      return { captchaId, captcha: plaintext };
    }
    if (svg) {
      const captcha = await solveCaptchaSvg(svg);
      console.error(`Login CAPTCHA (ocr): ${captcha}`);
      return { captchaId, captcha };
    }
    return undefined;
  }

  async postLogin(
    email: string,
    password: string,
    csrfToken: string,
    captcha?: { captchaId: string; captcha: string },
  ): Promise<ApiCallResult> {
    const start = Date.now();
    const rawResponse = await this.request.post(AuthPaths.login, {
      headers: this.buildCsrfHeaders(csrfToken),
      data: {
        email,
        password,
        ...(captcha ? { captchaId: captcha.captchaId, captcha: captcha.captcha } : {}),
      },
    });
    const responseBody = await rawResponse.json();
    return {
      rawResponse,
      responseBody,
      responseTime: Date.now() - start,
    };
  }

  async postLogin2fa(
    challengeToken: string,
    otp: string,
    csrfToken: string,
  ): Promise<ApiCallResult> {
    const start = Date.now();
    const rawResponse = await this.request.post(AuthPaths.login2fa, {
      headers: this.buildCsrfHeaders(csrfToken),
      data: { challengeToken, otp },
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
  async loginUntilSession(email: string, password: string): Promise<EstablishedAuthSession> {
    await this.getLoginPreflight();
    let csrfToken = await AuthMapper.resolveCsrfToken(this.request, {});
    const captcha = await this.getLoginCaptcha();

    const login = await this.postLogin(email, password, csrfToken, captcha);
    if (login.rawResponse.status() !== 200) {
      throw new Error(
        `Login failed with status ${login.rawResponse.status()}: ${JSON.stringify(login.responseBody)}`,
      );
    }

    let parsed = AuthLoginSuccessResponseSchema.parse(login.responseBody);
    let hitDeviceLimit = false;
    let maxAttempts = 4;
    const opening = parsed.data;
    if (isDeviceSelectionPayload(opening)) {
      hitDeviceLimit = true;
      maxAttempts = opening.devices.length + 3;
    }

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (AuthMapper.hasDirectSession(parsed.data)) {
        const freshCsrf = await AuthMapper.resolveCsrfToken(this.request, {});
        const session = {
          accessToken: parsed.data.accessToken,
          expiresIn: parsed.data.expiresIn ?? 900,
          csrfToken: freshCsrf,
        };
        if (hitDeviceLimit) {
          await this.revokeOtherDevices();
        }
        return session;
      }

      if (isTwoFactorChallengePayload(parsed.data)) {
        const totpSecret = getTotpSecret();
        if (!totpSecret) {
          throw new Error(
            "2FA required but TOTP_SECRET is not set — add the authenticator base32 secret to .env",
          );
        }
        csrfToken = await AuthMapper.resolveCsrfToken(this.request, {});
        let verify = await this.postLogin2fa(
          parsed.data.challengeToken,
          generateTotp(totpSecret, 0),
          csrfToken,
        );
        if (verify.rawResponse.status() !== 200) {
          csrfToken = await AuthMapper.resolveCsrfToken(this.request, {});
          verify = await this.postLogin2fa(
            parsed.data.challengeToken,
            generateTotp(totpSecret, -1),
            csrfToken,
          );
        }
        if (verify.rawResponse.status() !== 200) {
          throw new Error(`2FA verification failed: ${JSON.stringify(verify.responseBody)}`);
        }
        parsed = AuthLoginSuccessResponseSchema.parse(verify.responseBody);
        continue;
      }

      const selection = AuthMapper.mapDeviceSelection(parsed.data);
      if (!selection) {
        break;
      }

      hitDeviceLimit = true;

      console.log(
        `Device limit reached (${selection.devices.length} sessions). Closing listed sessions.`,
      );

      const keepDeviceId = process.env.DEVICE_ID?.trim();
      const sorted = [...selection.devices].sort((left, right) => {
        const leftTime = Date.parse(left.lastSeenAt ?? "") || 0;
        const rightTime = Date.parse(right.lastSeenAt ?? "") || 0;
        return leftTime - rightTime;
      });
      const releasable = keepDeviceId
        ? sorted.filter((device) => device.id !== keepDeviceId)
        : sorted;
      const targets = releasable.length > 0 ? releasable : sorted;

      csrfToken = await AuthMapper.resolveCsrfToken(this.request, {});
      let challengeToken = selection.challengeToken;

      for (const deviceToRelease of targets) {
        const release = await this.postReleaseDevice(challengeToken, deviceToRelease.id, csrfToken);

        if (release.rawResponse.status() !== 200) {
          throw new Error(`Device release failed: ${JSON.stringify(release.responseBody)}`);
        }

        parsed = AuthLoginSuccessResponseSchema.parse(release.responseBody);
        if (AuthMapper.hasDirectSession(parsed.data)) {
          break;
        }
        if (isTwoFactorChallengePayload(parsed.data)) {
          break;
        }

        const nextSelection = AuthMapper.mapDeviceSelection(parsed.data);
        if (!nextSelection) {
          break;
        }
        challengeToken = nextSelection.challengeToken;
        csrfToken = await AuthMapper.resolveCsrfToken(this.request, {});
      }
    }

    throw new Error("Login did not return a session after device selection");
  }

  private async revokeOtherDevices(): Promise<void> {
    const listed = await this.request.get(AuthPaths.devices, {
      headers: { Accept: "application/json" },
    });
    if (listed.status() !== 200) {
      return;
    }
    const body = (await listed.json()) as {
      data?: {
        devices?: Array<{ id?: string; isCurrentDevice?: boolean; revokedAt?: string | null }>;
        deviceGroups?: Array<{
          devices?: Array<{
            id?: string;
            isCurrentDevice?: boolean;
            revokedAt?: string | null;
          }>;
        }>;
      };
    };
    const keepDeviceId = process.env.DEVICE_ID?.trim();
    const grouped = Array.isArray(body.data?.deviceGroups)
      ? body.data!.deviceGroups.flatMap((group) => group.devices ?? [])
      : [];
    const root = Array.isArray(body.data?.devices) ? body.data!.devices : [];
    const seen = new Set<string>();
    for (const device of [...root, ...grouped]) {
      const id = device.id?.trim();
      if (
        !id ||
        seen.has(id) ||
        device.isCurrentDevice ||
        device.revokedAt ||
        (keepDeviceId && id === keepDeviceId)
      ) {
        continue;
      }
      seen.add(id);
      await this.request.delete(AuthPaths.deviceById(id));
    }
  }
}
