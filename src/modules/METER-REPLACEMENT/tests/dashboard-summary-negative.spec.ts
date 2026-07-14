import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { DashboardSummaryApi } from "../Api/dashboard-summary.api";
import { DashboardSummaryMapper } from "../Mapper/dashboard-summary.mapper";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import {
  MeterReplacementCommonValidator,
  meterReplacementAuthData,
  meterReplacementPaths,
} from "../Validator/meter-replacement-common.validator";

test.describe("Meter Replacement Dashboard Summary API — Negative & Edge", () => {
  test(
    "Ignored query params still return dashboard summary",
    {
      tag: ["@meter-replacement", "@dashboard-summary", "@edge"],
    },
    async ({ authenticatedApi }) => {
      const api = new DashboardSummaryApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();

      const { rawResponse, responseBody, responseTime } =
        await api.getDashboardSummary({
          foo: "bar",
          period: "weekly",
          q: "' OR 1=1 --",
        });

      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );

      const mapped = DashboardSummaryMapper.map(responseBody);

      validation.execute("Envelope", () => {
        expect(mapped.success).toBeTruthy();
        expect(mapped.overall).toBeDefined();
        expect(mapped.myWork).toBeDefined();
      });

      validation.printSummary(
        "Dashboard Summary — Query Pollution",
        responseTime,
      );
    },
  );

  test(
    "Trailing slash still returns dashboard summary",
    {
      tag: ["@meter-replacement", "@dashboard-summary", "@edge"],
    },
    async ({ authenticatedApi }) => {
      const api = new DashboardSummaryApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();

      const { rawResponse, responseBody, responseTime } =
        await api.getDashboardSummaryWithTrailingSlash();

      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );

      validation.execute("Envelope", () => {
        expect(responseBody.success).toBeTruthy();
        expect(responseBody.data?.overall).toBeDefined();
        expect(responseBody.data?.myWork).toBeDefined();
      });

      validation.printSummary(
        "Dashboard Summary — Trailing Slash",
        responseTime,
      );
    },
  );
});

authTest.describe("Meter Replacement Dashboard Summary API — Auth Negative", () => {
  authTest(
    "Missing Authorization returns 401",
    {
      tag: ["@meter-replacement", "@dashboard-summary", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const rawResponse =
        await MeterReplacementCommonValidator.getUnauthenticated(
          unauthenticatedApi,
          meterReplacementPaths.dashboardSummary,
        );
      const body = await rawResponse.json().catch(() => ({}));

      validation.execute("Unauthorized", () =>
        MeterReplacementCommonValidator.validateUnauthorizedError(
          rawResponse.status(),
          body,
        ),
      );
      validation.printSummary("Dashboard Summary — Missing Auth", 0);
    },
  );

  authTest(
    "Invalid Bearer token returns 401",
    {
      tag: ["@meter-replacement", "@dashboard-summary", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();

      for (const authorization of [
        meterReplacementAuthData.invalidBearerToken,
        meterReplacementAuthData.malformedBearerToken,
        meterReplacementAuthData.emptyBearerToken,
      ]) {
        const rawResponse =
          await MeterReplacementCommonValidator.getUnauthenticated(
            unauthenticatedApi,
            meterReplacementPaths.dashboardSummary,
            { headers: { Authorization: authorization } },
          );
        const body = await rawResponse.json().catch(() => ({}));

        validation.execute(`Unauthorized (${authorization.slice(0, 18)})`, () =>
          MeterReplacementCommonValidator.validateUnauthorizedError(
            rawResponse.status(),
            body,
          ),
        );
      }

      validation.printSummary("Dashboard Summary — Invalid Auth", 0);
    },
  );

  authTest(
    "Disallowed HTTP methods are rejected",
    {
      tag: ["@meter-replacement", "@dashboard-summary", "@negative"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const callers =
        MeterReplacementCommonValidator.getDisallowedMethodCallers(
          unauthenticatedApi,
          meterReplacementPaths.dashboardSummary,
        );

      for (const method of meterReplacementAuthData.disallowedMethods) {
        const rawResponse = await callers[method]();
        validation.execute(`${method} status`, () =>
          MeterReplacementCommonValidator.validateDisallowedMethodRejected(
            rawResponse.status(),
          ),
        );
      }

      validation.printSummary("Dashboard Summary — Disallowed Methods", 0);
    },
  );
});
