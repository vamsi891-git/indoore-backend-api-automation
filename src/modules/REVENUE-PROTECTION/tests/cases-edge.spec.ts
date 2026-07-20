import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { CasesApi } from "../Api/cases.api";
import {
  casesDefaultQuery,
  casesMaxResponseTimeMs,
  casesZeroRowsQuery,
} from "../Data/cases.data";
import { CasesMapper } from "../Mapper/cases.mapper";
import { CasesValidator } from "../Validator/cases.validator";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { CasesSuccessResponseSchema } from "../schemas/cases.schemas";

test.describe("Revenue Protection — Cases Edge", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  test(
    "IND-RPT-004 — Page far beyond total returns empty rows (not page-1 fallback)",
    { tag: ["@revenue-protection", "@cases", "@edge"] },
    async ({ authenticatedApi }) => {
      await applyAllureTestCaseId("IND-RPT-004");
      const api = new CasesApi(authenticatedApi);
      const validation = new ValidationEngine();
      const validator = new CasesValidator();
      const { rawResponse, responseBody, responseTime } = await api.getCases({
        ...casesDefaultQuery,
        page: 9999,
        limit: 10,
      });
      const assert = new AssertionEngine();
      const mapped = CasesMapper.mapData(responseBody.data);

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Schema Validation", () =>
        assertZodSchema(CasesSuccessResponseSchema, responseBody),
      );
      validation.execute("Pagination", () =>
        validator.validatePagination(mapped),
      );
      validation.execute("Empty page beyond total", () => {
        expect(mapped.pagination.page).toBe(9999);
        if (mapped.pagination.total <= (9999 - 1) * mapped.pagination.limit) {
          expect(mapped.rows.length).toBe(0);
        }
      });
      validation.printSummary("Cases — Page Beyond Total", responseTime);
    },
  );

  test(
    "IND-RPT-005 — Single-page result: total equals returned records",
    { tag: ["@revenue-protection", "@cases", "@edge"] },
    async ({ authenticatedApi }) => {
      await applyAllureTestCaseId("IND-RPT-005");
      const api = new CasesApi(authenticatedApi);
      const validation = new ValidationEngine();
      const validator = new CasesValidator();
      const { rawResponse, responseBody, responseTime } = await api.getCases({
        ...casesDefaultQuery,
        page: 1,
        limit: 100,
      });
      const assert = new AssertionEngine();
      const mapped = CasesMapper.mapData(responseBody.data);

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, casesMaxResponseTimeMs),
      );
      validation.execute("Pagination", () =>
        validator.validatePagination(mapped),
      );
      validation.execute("Month/Year Echo", () =>
        validator.validateMonthYearEcho(mapped, {
          ...casesDefaultQuery,
          page: 1,
          limit: 100,
        }),
      );
      validation.printSummary("Cases — Single Page Total Match", responseTime);
    },
  );

  test(
    "IND-RPT-006 — Filter combination returning zero rows → success empty grid",
    { tag: ["@revenue-protection", "@cases", "@edge"] },
    async ({ authenticatedApi }) => {
      await applyAllureTestCaseId("IND-RPT-006");
      const api = new CasesApi(authenticatedApi);
      const validation = new ValidationEngine();
      const { rawResponse, responseBody, responseTime } =
        await api.getCases(casesZeroRowsQuery);
      const assert = new AssertionEngine();
      const mapped = CasesMapper.mapData(responseBody.data);

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Empty success grid", () => {
        expect(responseBody.success).toBeTruthy();
        expect(mapped.rows.length).toBe(0);
        expect(mapped.pagination.total).toBe(0);
        expect(mapped.pagination.totalPages).toBe(0);
      });
      validation.printSummary("Cases — Zero Rows Filter", responseTime);
    },
  );
});
