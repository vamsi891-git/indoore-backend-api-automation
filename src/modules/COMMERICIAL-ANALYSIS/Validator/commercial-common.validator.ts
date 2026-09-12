import { expect } from "@playwright/test";
import type { APIRequestContext, APIResponse } from "@playwright/test";

export const commercialPaths = {
  summary: "/indore/analysis/commercial/summary",
  pf: "/indore/analysis/commercial/pf",
  md: "/indore/analysis/commercial/md",
  lf: "/indore/analysis/commercial/lf",
  consumptionCompare: "/indore/analysis/commercial/consumption-compare",
  consumptionPattern: "/indore/analysis/commercial/consumption-pattern",
  dayNight: "/indore/analysis/commercial/day-night",
} as const;

export const commercialAuthData = {
  expectedUnauthorizedStatus: 401,
  expectedUnauthorizedCode: "UNAUTHORIZED",
  expectedInvalidTokenCode: "ACCESS_TOKEN_INVALID",
  invalidBearerToken: "Bearer invalid.token.value",
  malformedBearerToken: "not-a-bearer-token",
  emptyBearerToken: "Bearer ",
  disallowedMethods: ["POST", "PUT", "PATCH", "DELETE"] as const,
};

export type CommercialErrorBody = {
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
    details?: { missingMonths?: string[] };
  };
  message?: string;
  data?: unknown;
};

export class CommercialCommonValidator {static validateUnauthorizedError(status: number,body: CommercialErrorBody,): void {
    expect(status).toBe(commercialAuthData.expectedUnauthorizedStatus);
    expect(body.success).toBeFalsy();
    expect([commercialAuthData.expectedUnauthorizedCode,commercialAuthData.expectedInvalidTokenCode,]).toContain(body.error?.code);
    expect(typeof (body.error?.message ?? body.message)).toBe("string");
    expect(String(body.error?.message ?? body.message ?? "").trim().length,).toBeGreaterThan(0);
  }
  static validateDisallowedMethodRejected(status: number): void {
    expect([403, 404, 405, 501]).toContain(status);
  }
  static validateErrorEnvelope(body: CommercialErrorBody,expectedCodes?: string[],): void {
    expect(body.success).toBeFalsy();
    const message = body.error?.message ?? body.message;
    expect(typeof message === "string" && message.trim().length > 0,).toBeTruthy();
    if (expectedCodes?.length) {
      expect(expectedCodes).toContain(body.error?.code);
    }
  }

  /** Live coverage gate: success=false, code BILLING_PERIOD_NOT_READY, optional missingMonths. */
  static validateBillingPeriodNotReady(
    status: number,
    body: CommercialErrorBody,
    expectedMissingMonths?: readonly string[],
  ): void {
    expect(
      [200, 400, 409, 422, 503],
      `BILLING_PERIOD_NOT_READY status was ${status}`,
    ).toContain(status);
    expect(body.success).toBeFalsy();
    expect(body.error?.code).toBe("BILLING_PERIOD_NOT_READY");
    expect(String(body.error?.message ?? body.message ?? "").trim().length).toBeGreaterThan(
      0,
    );
    if (expectedMissingMonths?.length) {
      const actual = body.error?.details?.missingMonths ?? [];
      for (const month of expectedMissingMonths) {
        expect(actual, `missingMonths should include ${month}`).toContain(month);
      }
    }
  }

  /**
   * Avg-less-than-initial pattern returns INTERNAL_ERROR (500) instead of
   * BILLING_PERIOD_NOT_READY when the billing window is incomplete.
   */
  static validateBillingCoverageUnavailable(
    status: number,
    body: CommercialErrorBody,
  ): void {
    if (body.error?.code === "BILLING_PERIOD_NOT_READY") {
      this.validateBillingPeriodNotReady(status, body);
      return;
    }
    expect(status).toBe(500);
    expect(body.success).toBeFalsy();
    expect(body.error?.code).toBe("INTERNAL_ERROR");
    expect(String(body.error?.message ?? body.message ?? "").trim().length).toBeGreaterThan(
      0,
    );
  }
  /**
   * Raw unauthenticated call — do not use getCommercialWithRetry /
   * getWithAutoRefresh (those inject TokenManager Bearer tokens).
   */
  static async getUnauthenticated(unauthenticatedApi: APIRequestContext,path: string,options?: Parameters<APIRequestContext["get"]>[1],): Promise<APIResponse> {
    return unauthenticatedApi.get(path, options);
  }
  static getDisallowedMethodCallers(unauthenticatedApi: APIRequestContext,path: string,): Record<string, () => Promise<APIResponse>> {
    return {
      POST: () => unauthenticatedApi.post(path, { data: {} }),
      PUT: () => unauthenticatedApi.put(path, { data: {} }),
      PATCH: () => unauthenticatedApi.patch(path, { data: {} }),
      DELETE: () => unauthenticatedApi.delete(path),
    };
  }
}
