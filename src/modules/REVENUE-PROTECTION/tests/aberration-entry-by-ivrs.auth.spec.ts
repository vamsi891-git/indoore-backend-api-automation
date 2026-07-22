import { expect } from "@playwright/test";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { ApiErrorResponseSchema } from "../../../core/schemas/api-response.schemas";
import { resolveAberrationEntryByIvrsPath } from "../Api/aberration-entry.api";
import {
  buildAberrationEntryUpdatePayload,
  resolveAberrationEntryKnownIvrs,
} from "../Data/aberration-entry-by-ivrs.data";
import {
  RevenueCommonValidator,
  revenueProtectionAuthData,
  type RevenueErrorBody,
} from "../Validator/revenue-common.validator";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { requestRevenueProtectionWithRetry } from "../utils/revenue-protection-request.helper";

/** Fallback IVRS when env unset — auth probes only need a path, not a live row. */
const byIvrsUrl = resolveAberrationEntryByIvrsPath(
  resolveAberrationEntryKnownIvrs() ?? "N3374032876",
);

const updatePayload = buildAberrationEntryUpdatePayload();

authTest.describe("Revenue Protection — Aberration Entry By IVRS Auth Negative", () => {
  authTest.describe.configure({ mode: "serial" });
  authTest.setTimeout(180_000);

  authTest("IND-REV-ABE-IVRS-AUTH-001 — PATCH without Authorization header",
    {
      tag: [
        "@revenue-protection",
        "@aberration-entry-by-ivrs",
        "@negative",
        "@auth",
      ],
    },
    async ({ unauthenticatedApi }) => {
      await applyAllureTestCaseId("IND-REV-ABE-IVRS-AUTH-001");
      const validation = new ValidationEngine();
      const rawResponse = await requestRevenueProtectionWithRetry(() =>
        unauthenticatedApi.patch(byIvrsUrl, { data: updatePayload }),
      );
      const body = (await rawResponse.json().catch(() => ({}))) as RevenueErrorBody;
      validation.execute("Unauthorized / forbidden without auth", () => {
        // PATCH update route returns 403 (CSRF/gateway) or 401 depending on layer.
        expect([401, 403]).toContain(rawResponse.status());
        expect(body.success).toBeFalsy();
        const message = body.error?.message ?? body.message;
        expect(typeof message === "string" && message.trim().length > 0).toBeTruthy();
      });
      validation.execute("ErrorResponseSchema", () =>
        assertZodSchema(ApiErrorResponseSchema, body),
      );
      validation.printSummary("By IVRS — Missing Auth", 0);
    },
  );

  authTest("IND-REV-ABE-IVRS-AUTH-002 — PATCH with invalid bearer token",
    {
      tag: [
        "@revenue-protection",
        "@aberration-entry-by-ivrs",
        "@negative",
        "@auth",
      ],
    },
    async ({ unauthenticatedApi }) => {
      await applyAllureTestCaseId("IND-REV-ABE-IVRS-AUTH-002");
      const validation = new ValidationEngine();
      const rawResponse = await requestRevenueProtectionWithRetry(() =>
        unauthenticatedApi.patch(byIvrsUrl, {
          data: updatePayload,
          headers: {
            Authorization: revenueProtectionAuthData.invalidBearerToken,
          },
        }),
      );
      const body = (await rawResponse.json().catch(() => ({}))) as RevenueErrorBody;
      validation.execute("Unauthorized / invalid token", () => {
        expect([401, 403]).toContain(rawResponse.status());
        expect(body.success).toBeFalsy();
        const code = body.error?.code;
        if (rawResponse.status() === 401) {
          expect([
            revenueProtectionAuthData.expectedUnauthorizedCode,
            revenueProtectionAuthData.expectedInvalidTokenCode,
          ]).toContain(code);
        } else {
          expect(typeof code === "string" && code.trim().length > 0).toBeTruthy();
        }
      });
      validation.execute("ErrorResponseSchema", () =>
        assertZodSchema(ApiErrorResponseSchema, body),
      );
      validation.printSummary("By IVRS — Invalid Token", 0);
    },
  );

  authTest("IND-REV-ABE-IVRS-AUTH-003 — Unsupported HTTP methods (POST/PUT/DELETE)",
    {
      tag: [
        "@revenue-protection",
        "@aberration-entry-by-ivrs",
        "@negative",
        "@auth",
      ],
    },
    async ({ unauthenticatedApi }) => {
      await applyAllureTestCaseId("IND-REV-ABE-IVRS-AUTH-003");
      const validation = new ValidationEngine();
      /** PATCH is the supported update verb — do not treat it as disallowed. */
      const callers: Record<string, () => Promise<import("@playwright/test").APIResponse>> = {
        POST: () =>
          requestRevenueProtectionWithRetry(() =>
            unauthenticatedApi.post(byIvrsUrl, { data: updatePayload }),
          ),
        PUT: () =>
          requestRevenueProtectionWithRetry(() =>
            unauthenticatedApi.put(byIvrsUrl, { data: updatePayload }),
          ),
        DELETE: () =>
          requestRevenueProtectionWithRetry(() =>
            unauthenticatedApi.delete(byIvrsUrl),
          ),
      };
      for (const method of Object.keys(callers)) {
        const response = await callers[method]();
        validation.execute(`${method} rejected`, () =>
          RevenueCommonValidator.validateDisallowedMethodRejected(response.status()),
        );
      }
      validation.printSummary("By IVRS — Disallowed Methods", 0);
    },
  );
});
