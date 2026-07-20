import { expect } from "@playwright/test";
import type { APIRequestContext, APIResponse } from "@playwright/test";
export const consumptionPaths = {
  patternConsumption: "/indore/consumption/pattern-consumption",
  monthlyNetMeter: "/indore/consumption/monthly-net-meter",
  report: "/indore/consumption/report",
} as const;
export const consumptionAuthData = {
  expectedUnauthorizedStatus: 401,
  expectedUnauthorizedCode: "UNAUTHORIZED",
  expectedInvalidTokenCode: "ACCESS_TOKEN_INVALID",
  invalidBearerToken: "Bearer invalid.token.value",
  malformedBearerToken: "not-a-bearer-token",
  emptyBearerToken: "Bearer ",
  disallowedMethods: ["POST", "PUT", "PATCH", "DELETE"] as const,
};
export type ConsumptionErrorBody = {
  success?: boolean;
  error?: { code?: string; message?: string };
  message?: string;
  data?: unknown;
};
export class ConsumptionCommonValidator {
  static validateUnauthorizedError(
    status: number,
    body: ConsumptionErrorBody,
  ): void {
    expect(status).toBe(consumptionAuthData.expectedUnauthorizedStatus);
    expect(body.success).toBeFalsy();
    expect([
      consumptionAuthData.expectedUnauthorizedCode,
      consumptionAuthData.expectedInvalidTokenCode,
    ]).toContain(body.error?.code);
    expect(typeof (body.error?.message ?? body.message)).toBe("string");
    expect(
      String(body.error?.message ?? body.message ?? "").trim().length,
    ).toBeGreaterThan(0);
  }
  static validateDisallowedMethodRejected(status: number): void {
    expect([403, 404, 405, 501]).toContain(status);
  }
  static validateClientError(status: number): void {
    expect([400, 404, 422]).toContain(status);
  }
  static validateErrorEnvelope(
    body: ConsumptionErrorBody,
    expectedCodes?: string[],
  ): void {
    expect(body.success).toBeFalsy();
    const message = body.error?.message ?? body.message;
    expect(typeof message === "string" && message.trim().length > 0).toBeTruthy();
    if (expectedCodes?.length) {
      expect(expectedCodes).toContain(body.error?.code);
    }
  }
  /**
   * Call the API with a raw unauthenticated context.
   * Do not use getConsumptionWithRetry / getWithAutoRefresh here — those inject
   * TokenManager Bearer tokens and defeat missing-auth negatives.
   */
  static async getUnauthenticated(
    unauthenticatedApi: APIRequestContext,
    path: string,
    options?: Parameters<APIRequestContext["get"]>[1],
  ): Promise<APIResponse> {
    return unauthenticatedApi.get(path, options);
  }
  static getDisallowedMethodCallers(
    unauthenticatedApi: APIRequestContext,
    path: string,
  ): Record<string, () => Promise<APIResponse>> {
    return {
      POST: () => unauthenticatedApi.post(path, { data: {} }),
      PUT: () => unauthenticatedApi.put(path, { data: {} }),
      PATCH: () => unauthenticatedApi.patch(path, { data: {} }),
      DELETE: () => unauthenticatedApi.delete(path),
    };
  }
}
