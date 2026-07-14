import { expect } from "@playwright/test";
import type { APIRequestContext, APIResponse } from "@playwright/test";
import { withRateLimitRetry } from "../utils/response.helper";

export const meterReplacementAuthData = {
  expectedUnauthorizedStatus: 401,
  expectedUnauthorizedCode: "UNAUTHORIZED",
  expectedInvalidTokenCode: "ACCESS_TOKEN_INVALID",
  invalidBearerToken: "Bearer invalid.token.value",
  malformedBearerToken: "not-a-bearer-token",
  emptyBearerToken: "Bearer ",
  disallowedMethods: ["POST", "PUT", "PATCH", "DELETE"] as const,
};

export type MeterReplacementErrorBody = {
  success?: boolean;
  error?: { code?: string; message?: string };
  message?: string;
  data?: unknown;
};

export class MeterReplacementCommonValidator {
  static validateUnauthorizedError(
    status: number,
    body: MeterReplacementErrorBody,
  ) {
    expect(status).toBe(
      meterReplacementAuthData.expectedUnauthorizedStatus,
    );
    expect(body.success).toBeFalsy();
    expect([
      meterReplacementAuthData.expectedUnauthorizedCode,
      meterReplacementAuthData.expectedInvalidTokenCode,
    ]).toContain(body.error?.code);
    expect(typeof (body.error?.message ?? body.message)).toBe("string");
    expect(
      String(body.error?.message ?? body.message ?? "").trim().length,
    ).toBeGreaterThan(0);
  }

  static validateDisallowedMethodRejected(status: number) {
    expect([403, 404, 405, 501]).toContain(status);
  }

  static validateNotFoundOrBadRequest(status: number) {
    expect([400, 404, 422]).toContain(status);
  }

  static validateClientOrNotFound(status: number) {
    expect([400, 404, 414, 422]).toContain(status);
  }

  static validateErrorEnvelope(
    body: MeterReplacementErrorBody,
    expectedCodes?: string[],
  ) {
    expect(body.success).toBeFalsy();
    const code = body.error?.code;
    const message = body.error?.message ?? body.message;
    expect(
      typeof message === "string" && message.trim().length > 0,
    ).toBeTruthy();
    if (expectedCodes?.length) {
      expect(expectedCodes).toContain(code);
    }
  }

  static async getUnauthenticated(
    unauthenticatedApi: APIRequestContext,
    path: string,
    options?: Parameters<APIRequestContext["get"]>[1],
  ): Promise<APIResponse> {
    return withRateLimitRetry(() => unauthenticatedApi.get(path, options));
  }

  static getDisallowedMethodCallers(
    unauthenticatedApi: APIRequestContext,
    path: string,
  ): Record<string, () => Promise<APIResponse>> {
    return {
      POST: () =>
        withRateLimitRetry(() =>
          unauthenticatedApi.post(path, { data: {} }),
        ),
      PUT: () =>
        withRateLimitRetry(() =>
          unauthenticatedApi.put(path, { data: {} }),
        ),
      PATCH: () =>
        withRateLimitRetry(() =>
          unauthenticatedApi.patch(path, { data: {} }),
        ),
      DELETE: () =>
        withRateLimitRetry(() => unauthenticatedApi.delete(path)),
    };
  }
}

export const meterReplacementPaths = {
  progress: "/indore/meter-replacement/progress",
  dashboardSummary: "/indore/meter-replacement/dashboard-summary",
  consumerSearch: "/indore/meter-replacement/consumers/search",
  consumerDetail: (id: string | number) =>
    `/indore/meter-replacement/consumers/${id}`,
  meterValidate: "/indore/meter-replacement/meters/validate",
  createSubmission: "/indore/meter-replacement/submissions",
  submissionDetail: (id: string | number) =>
    `/indore/meter-replacement/submissions/${id}`,
  submissionHistory: "/indore/meter-replacement/submissions/history",
};
