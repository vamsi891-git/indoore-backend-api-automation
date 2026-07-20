import { expect } from "@playwright/test";
import type { APIRequestContext, APIResponse } from "@playwright/test";
import { resolveAberrationEntryPath } from "../Api/aberration-entry.api";
import { REVENUE_PROTECTION_ABERRATION_ENTRY_BASE } from "../Api/aberration-entry.api";
import { REVENUE_PROTECTION_ATRZONE_PATH } from "../Api/atr-zone.api";
import { REVENUE_PROTECTION_CASES_PATH } from "../Api/cases.api";
import { requestRevenueProtectionWithRetry } from "../utils/revenue-protection-request.helper";
import { REVENUE_PROTECTION_ABERRATIONS_PATH } from "../Api/aberrations.api";

export const revenueProtectionPaths = {
  aberrations: REVENUE_PROTECTION_ABERRATIONS_PATH,
  aberrationEntry: resolveAberrationEntryPath("zone"),
  aberrationEntryEenltmt: resolveAberrationEntryPath("eenltmt"),
  aberrationEntryByIvrs: (ivrsNo: string) =>
    `${REVENUE_PROTECTION_ABERRATION_ENTRY_BASE}/${encodeURIComponent(ivrsNo.trim())}`,
  cases: REVENUE_PROTECTION_CASES_PATH,
  atrZone: REVENUE_PROTECTION_ATRZONE_PATH,
} as const;

export const revenueProtectionAuthData = {
  expectedUnauthorizedStatus: 401,
  expectedUnauthorizedCode: "UNAUTHORIZED",
  expectedInvalidTokenCode: "ACCESS_TOKEN_INVALID",
  invalidBearerToken: "Bearer invalid.token.value",
  disallowedMethods: ["POST", "PUT", "PATCH", "DELETE"] as const,
};

export type RevenueErrorBody = {
  success?: boolean;
  error?: { code?: string; message?: string };
  message?: string;
  data?: unknown;
};

export class RevenueCommonValidator {
  static validateUnauthorizedError(
    status: number,
    body: RevenueErrorBody,
  ): void {
    expect(status).toBe(revenueProtectionAuthData.expectedUnauthorizedStatus);
    expect(body.success).toBeFalsy();
    expect([
      revenueProtectionAuthData.expectedUnauthorizedCode,
      revenueProtectionAuthData.expectedInvalidTokenCode,
    ]).toContain(body.error?.code);
    const message = body.error?.message ?? body.message;
    expect(typeof message).toBe("string");
    expect(String(message ?? "").trim().length).toBeGreaterThan(0);
  }

  static validateErrorEnvelope(
    status: number,
    body: RevenueErrorBody,
    expectedCodes?: string[],
  ): void {
    expect(status).toBeGreaterThanOrEqual(400);
    expect(body.success).toBeFalsy();
    const message = body.error?.message ?? body.message;
    expect(
      typeof message === "string" && message.trim().length > 0,
    ).toBeTruthy();
    if (expectedCodes?.length) {
      expect(expectedCodes).toContain(body.error?.code);
    }
  }

  /**
   * Lenient filter contract: missing/invalid month-like filters return HTTP 200
   * with success:true and an empty grid (rows=[], total=0), not a 4xx envelope.
   */
  static validateEmptySuccessGrid(
    status: number,
    body: RevenueErrorBody,
  ): void {
    expect(status).toBe(200);
    expect(body.success).toBeTruthy();
    const data = body.data as
      | {
          rows?: unknown[];
          pagination?: { total?: number; totalPages?: number };
        }
      | undefined;
    expect(data).toBeDefined();
    expect(Array.isArray(data?.rows)).toBeTruthy();
    expect(data?.rows?.length ?? -1).toBe(0);
    expect(Number(data?.pagination?.total ?? -1)).toBe(0);
    expect(Number(data?.pagination?.totalPages ?? -1)).toBe(0);
  }

  static validateDisallowedMethodRejected(status: number): void {
    expect([401, 403, 404, 405, 501]).toContain(status);
  }

  static async getUnauthenticated(
    unauthenticatedApi: APIRequestContext,
    path: string,
    options?: Parameters<APIRequestContext["get"]>[1],
  ): Promise<APIResponse> {
    return requestRevenueProtectionWithRetry(() =>
      unauthenticatedApi.get(path, options),
    );
  }

  static getDisallowedMethodCallers(
    unauthenticatedApi: APIRequestContext,
    path: string,
  ): Record<string, () => Promise<APIResponse>> {
    return {
      POST: () =>
        requestRevenueProtectionWithRetry(() =>
          unauthenticatedApi.post(path, { data: {} }),
        ),
      PUT: () =>
        requestRevenueProtectionWithRetry(() =>
          unauthenticatedApi.put(path, { data: {} }),
        ),
      PATCH: () =>
        requestRevenueProtectionWithRetry(() =>
          unauthenticatedApi.patch(path, { data: {} }),
        ),
      DELETE: () =>
        requestRevenueProtectionWithRetry(() =>
          unauthenticatedApi.delete(path),
        ),
    };
  }
}
