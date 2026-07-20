import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { AberrationsApi } from "../Api/aberrations.api";
import {aberrationsDefaultQuery,aberrationsMaxResponseTimeMs,} from "../Data/aberrations.data";
import { AberrationsMapper } from "../Mapper/aberrations.mapper";
import { AberrationsValidator } from "../Validator/aberrations.validator";
test.describe("Revenue Protection — Aberrations Edge", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);
  test("Page far beyond total returns empty rows with consistent pagination",
    { tag: ["@revenue-protection", "@aberrations", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new AberrationsApi(authenticatedApi);
      const validation = new ValidationEngine();
      const validator = new AberrationsValidator();
      const { rawResponse, responseBody, responseTime } =
        await api.getAberrationSummary({
          ...aberrationsDefaultQuery,
          page: 9999,
          limit: 10,
        });
      const assert = new AssertionEngine();
      const mapped = AberrationsMapper.mapData(responseBody.data);
      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Pagination", () =>
        validator.validatePagination(mapped),
      );
      validation.execute("Empty page beyond total", () => {
        if (mapped.pagination.total <= (9999 - 1) * mapped.pagination.limit) {
          expect(mapped.rows.length).toBe(0);
        }
      });
      validation.execute("Total Count Matches Records", () =>
        validator.validateTotalCountMatchesRecords(mapped),
      );
      validation.printSummary("Aberrations — Page Beyond Total", responseTime);
    },
  );
  test("Single-page result: total count equals returned records",
    { tag: ["@revenue-protection", "@aberrations", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new AberrationsApi(authenticatedApi);
      const validation = new ValidationEngine();
      const validator = new AberrationsValidator();
      const { rawResponse, responseBody, responseTime } =
        await api.getAberrationSummary({
          ...aberrationsDefaultQuery,
          page: 1,
          limit: 100,
        });
      const assert = new AssertionEngine();
      const mapped = AberrationsMapper.mapData(responseBody.data);
      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, aberrationsMaxResponseTimeMs),
      );
      validation.execute("Pagination", () =>
        validator.validatePagination(mapped),
      );
      validation.execute("Total Count Matches Records", () =>
        validator.validateTotalCountMatchesRecords(mapped),
      );
      validation.execute("Case Count Consistency", () =>
        validator.validateCaseCountConsistency(mapped),
      );
      validation.printSummary("Aberrations — Single Page Total Match",responseTime,);
    },
  );
});
