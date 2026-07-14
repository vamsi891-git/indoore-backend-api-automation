import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { SubmissionHistoryApi } from "../Api/submission-history.api";
import { submissionHistoryData } from "../Data/submission-history.data";
import { SubmissionHistoryMapper } from "../Mapper/submission-history.mapper";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import {
  MeterReplacementCommonValidator,
  meterReplacementAuthData,
  meterReplacementPaths,
} from "../Validator/meter-replacement-common.validator";
import { pauseMs } from "../utils/response.helper";

async function getHistoryWithRetry(
  api: SubmissionHistoryApi,
  page: number,
  limit: number,
  search?: string,
  status?: string,
  dateFrom?: string,
  dateTo?: string,
) {
  let result = await api.getSubmissionHistory(
    page,
    limit,
    search,
    status,
    dateFrom,
    dateTo,
  );

  if (result.rawResponse.status() === 429) {
    await pauseMs(5000);
    result = await api.getSubmissionHistory(
      page,
      limit,
      search,
      status,
      dateFrom,
      dateTo,
    );
  }

  if (result.rawResponse.status() === 429) {
    await pauseMs(8000);
    result = await api.getSubmissionHistory(
      page,
      limit,
      search,
      status,
      dateFrom,
      dateTo,
    );
  }

  return result;
}

test.describe("Meter Replacement Submission History API - Filters and Edge", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async () => {
    await pauseMs(800);
  });

  test(
    "Filter by PENDING status returns matching items",
    {
      tag: ["@meter-replacement", "@submission-history", "@positive", "@edge"],
    },
    async ({ authenticatedApi }) => {
      const api = new SubmissionHistoryApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();

      const { rawResponse, responseBody, responseTime } =
        await getHistoryWithRetry(
          api,
          submissionHistoryData.page,
          submissionHistoryData.limit,
          undefined,
          submissionHistoryData.pendngStatus,
        );

      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );

      const mapped = SubmissionHistoryMapper.map(responseBody);

      validation.execute("Items are PENDING", () => {
        expect(mapped.success).toBeTruthy();
        mapped.items.forEach((item) => {
          expect(item.status.toUpperCase()).toBe("PENDING");
        });
      });

      validation.printSummary(
        "Submission History - PENDING Filter",
        responseTime,
      );
    },
  );

  test(
    "Filter by COMPLETED status returns bounded list",
    {
      tag: ["@meter-replacement", "@submission-history", "@positive", "@edge"],
    },
    async ({ authenticatedApi }) => {
      const api = new SubmissionHistoryApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();

      const { rawResponse, responseBody, responseTime } =
        await getHistoryWithRetry(
          api,
          submissionHistoryData.page,
          submissionHistoryData.limit,
          undefined,
          submissionHistoryData.completedStatus,
        );

      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );

      const mapped = SubmissionHistoryMapper.map(responseBody);

      validation.execute("Items are COMPLETED", () => {
        mapped.items.forEach((item) => {
          expect(item.status.toUpperCase()).toBe("COMPLETED");
        });
      });

      validation.printSummary(
        "Submission History - COMPLETED Filter",
        responseTime,
      );
    },
  );

  test(
    "Search by consumer name and meter serial",
    {
      tag: ["@meter-replacement", "@submission-history", "@positive", "@edge"],
    },
    async ({ authenticatedApi }) => {
      const api = new SubmissionHistoryApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();

      for (const search of [
        submissionHistoryData.validSearch,
        submissionHistoryData.meterSearch,
      ]) {
        const { rawResponse, responseBody } = await getHistoryWithRetry(
          api,
          submissionHistoryData.page,
          submissionHistoryData.limit,
          search,
        );

        validation.execute(`Status (${search})`, () =>
          assert.validateStatusCode(rawResponse, 200, responseBody),
        );

        validation.execute(`Has items (${search})`, () => {
          expect(responseBody.success).toBeTruthy();
          expect(responseBody.data.items.length).toBeGreaterThan(0);
        });

        await pauseMs(500);
      }

      validation.printSummary("Submission History - Search Filters", 0);
    },
  );

  test(
    "Valid date range returns success",
    {
      tag: ["@meter-replacement", "@submission-history", "@positive", "@edge"],
    },
    async ({ authenticatedApi }) => {
      const api = new SubmissionHistoryApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();

      const { rawResponse, responseBody, responseTime } =
        await getHistoryWithRetry(
          api,
          submissionHistoryData.page,
          submissionHistoryData.limit,
          undefined,
          undefined,
          submissionHistoryData.validDateFrom,
          submissionHistoryData.vaidDateTo,
        );

      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );

      validation.execute("Envelope", () => {
        expect(responseBody.success).toBeTruthy();
        expect(responseBody.data.pagination).toBeDefined();
      });

      validation.printSummary("Submission History - Date Range", responseTime);
    },
  );
});

test.describe("Meter Replacement Submission History API - Negative", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async () => {
    await pauseMs(1200);
  });

  test(
    "Invalid pagination returns validation error",
    {
      tag: ["@meter-replacement", "@submission-history", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new SubmissionHistoryApi(authenticatedApi);
      const validation = new ValidationEngine();

      const cases = [
        {
          label: "zero page",
          page: submissionHistoryData.zeroPage,
          limit: submissionHistoryData.defaultLimit,
        },
        {
          label: "negative page",
          page: submissionHistoryData.negtivePage,
          limit: submissionHistoryData.defaultLimit,
        },
        {
          label: "zero limit",
          page: submissionHistoryData.firstPage,
          limit: submissionHistoryData.zeroLimit,
        },
        {
          label: "negative limit",
          page: submissionHistoryData.firstPage,
          limit: submissionHistoryData.negativeLimit,
        },
      ];

      for (const testCase of cases) {
        const { rawResponse, responseBody } = await getHistoryWithRetry(
          api,
          testCase.page,
          testCase.limit,
        );

        validation.execute(`Status (${testCase.label})`, () => {
          expect(rawResponse.status()).toBe(400);
        });

        validation.execute(`Error (${testCase.label})`, () =>
          MeterReplacementCommonValidator.validateErrorEnvelope(
            responseBody,
            ["VALIDATION_ERROR"],
          ),
        );

        await pauseMs(400);
      }

      validation.printSummary("Submission History - Invalid Pagination", 0);
    },
  );

  test(
    "Unknown search returns empty page",
    {
      tag: ["@meter-replacement", "@submission-history", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new SubmissionHistoryApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();

      const { rawResponse, responseBody } = await getHistoryWithRetry(
        api,
        submissionHistoryData.page,
        submissionHistoryData.limit,
        submissionHistoryData.invalidSearch,
      );

      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );

      const mapped = SubmissionHistoryMapper.map(responseBody);

      validation.execute("Empty items", () => {
        expect(mapped.items.length).toBe(0);
        expect(mapped.pagination.total).toBe(0);
      });

      validation.printSummary("Submission History - Unknown Search", 0);
    },
  );

  test(
    "Invalid status returns empty page",
    {
      tag: ["@meter-replacement", "@submission-history", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new SubmissionHistoryApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();

      const { rawResponse, responseBody } = await getHistoryWithRetry(
        api,
        submissionHistoryData.page,
        submissionHistoryData.limit,
        undefined,
        submissionHistoryData.invalidStatus,
      );

      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );

      validation.execute("Empty items", () => {
        expect(responseBody.data.items.length).toBe(0);
      });

      validation.printSummary("Submission History - Invalid Status", 0);
    },
  );

  test(
    "Injection-like search does not 500",
    {
      tag: [
        "@meter-replacement",
        "@submission-history",
        "@negative",
        "@security",
      ],
    },
    async ({ authenticatedApi }) => {
      const api = new SubmissionHistoryApi(authenticatedApi);
      const validation = new ValidationEngine();

      for (const search of [
        submissionHistoryData.sqlInjection,
        submissionHistoryData.xssInjection,
        submissionHistoryData.emojiSearch,
      ]) {
        const { rawResponse, responseBody } = await getHistoryWithRetry(
          api,
          submissionHistoryData.page,
          submissionHistoryData.limit,
          search,
        );

        validation.execute(`No 500 (${search.slice(0, 12)})`, () => {
          expect(rawResponse.status()).toBeLessThan(500);
        });

        validation.execute(`Handled (${search.slice(0, 12)})`, () => {
          expect(
            rawResponse.status() === 200 || responseBody.success === false,
          ).toBeTruthy();
        });

        await pauseMs(600);
      }

      validation.printSummary("Submission History - Injection Search", 0);
    },
  );

  test(
    "Invalid date returns error (backend may 400 or 500)",
    {
      tag: ["@meter-replacement", "@submission-history", "@negative"],
    },
    async ({ authenticatedApi }) => {
      const api = new SubmissionHistoryApi(authenticatedApi);
      const validation = new ValidationEngine();

      const { rawResponse, responseBody } = await getHistoryWithRetry(
        api,
        submissionHistoryData.page,
        submissionHistoryData.limit,
        undefined,
        undefined,
        submissionHistoryData.invalidDate,
      );

      validation.execute("Error status", () => {
        expect([400, 422, 500]).toContain(rawResponse.status());
      });

      validation.execute("Success false", () => {
        expect(responseBody.success).toBeFalsy();
      });

      validation.printSummary("Submission History - Invalid Date", 0);
    },
  );

  test(
    "Out of range page returns empty page",
    {
      tag: ["@meter-replacement", "@submission-history", "@edge"],
    },
    async ({ authenticatedApi }) => {
      const api = new SubmissionHistoryApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();

      const { rawResponse, responseBody } = await getHistoryWithRetry(
        api,
        submissionHistoryData.lastPage,
        submissionHistoryData.minimumLimit,
      );

      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );

      validation.execute("Empty or short page", () => {
        expect(responseBody.data.items.length).toBeLessThanOrEqual(
          submissionHistoryData.minimumLimit,
        );
      });

      validation.printSummary("Submission History - Last Page", 0);
    },
  );
});

authTest.describe("Meter Replacement Submission History API - Auth Negative", () => {
  authTest.describe.configure({ mode: "serial" });

  authTest.beforeEach(async () => {
    await pauseMs(3000);
  });

  authTest(
    "Missing Authorization returns 401",
    {
      tag: ["@meter-replacement", "@submission-history", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const rawResponse =
        await MeterReplacementCommonValidator.getUnauthenticated(
          unauthenticatedApi,
          meterReplacementPaths.submissionHistory,
          {
            params: {
              page: submissionHistoryData.page,
              limit: submissionHistoryData.limit,
            },
          },
        );
      const body = await rawResponse.json().catch(() => ({}));

      validation.execute("Unauthorized", () =>
        MeterReplacementCommonValidator.validateUnauthorizedError(
          rawResponse.status(),
          body,
        ),
      );
      validation.printSummary("Submission History - Missing Auth", 0);
    },
  );

  authTest(
    "Invalid Bearer token returns 401",
    {
      tag: ["@meter-replacement", "@submission-history", "@negative", "@auth"],
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
            meterReplacementPaths.submissionHistory,
            {
              params: {
                page: submissionHistoryData.page,
                limit: submissionHistoryData.limit,
              },
              headers: { Authorization: authorization },
            },
          );
        const body = await rawResponse.json().catch(() => ({}));

        validation.execute(`Unauthorized (${authorization.slice(0, 18)})`, () =>
          MeterReplacementCommonValidator.validateUnauthorizedError(
            rawResponse.status(),
            body,
          ),
        );

        await pauseMs(400);
      }

      validation.printSummary("Submission History - Invalid Auth", 0);
    },
  );

  authTest(
    "Disallowed HTTP methods are rejected",
    {
      tag: ["@meter-replacement", "@submission-history", "@negative"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const callers =
        MeterReplacementCommonValidator.getDisallowedMethodCallers(
          unauthenticatedApi,
          meterReplacementPaths.submissionHistory,
        );

      for (const method of meterReplacementAuthData.disallowedMethods) {
        const rawResponse = await callers[method]();
        validation.execute(`${method} status`, () =>
          MeterReplacementCommonValidator.validateDisallowedMethodRejected(
            rawResponse.status(),
          ),
        );
        await pauseMs(300);
      }

      validation.printSummary("Submission History - Disallowed Methods", 0);
    },
  );
});
