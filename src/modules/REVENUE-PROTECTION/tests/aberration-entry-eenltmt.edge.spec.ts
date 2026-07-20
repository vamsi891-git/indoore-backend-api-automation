import { expect } from "@playwright/test";
import { test } from "../../../fixtures/observability.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { AberrationEntryApi } from "../Api/aberration-entry.api";
import { aberrationEntryMaxResponseTimeMs } from "../Data/aberration-entry.data";
import {
  aberrationEntryEenltmtDefaultQuery,
  aberrationEntryEenltmtZeroRowsQuery,
} from "../Data/aberration-entry-eenltmt.data";
import { AberrationEntryMapper } from "../Mapper/aberration-entry.mapper";
import { AberrationEntryValidator } from "../Validator/aberration-entry.validator";
import { AberrationEntrySuccessResponseSchema } from "../schemas/aberration-entry.schemas";

test.describe("Revenue Protection — Aberration Entry EENLTMT Edge", () => {
  test.describe.configure({ retries: 1, mode: "serial" });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  test(
    "IND-REV-ABE-EEN-EDGE-001 — Page far beyond total returns empty rows",
    { tag: ["@revenue-protection", "@aberration-entry-eenltmt", "@edge"] },
    async ({ authenticatedApi, obs }) => {
      await applyAllureTestCaseId("IND-REV-ABE-EEN-EDGE-001");
      const api = new AberrationEntryApi(authenticatedApi);
      const validation = new ValidationEngine(obs);
      const validator = new AberrationEntryValidator();
      const { rawResponse, responseBody, responseTime } =
        await api.getAberrationEntry({
          ...aberrationEntryEenltmtDefaultQuery,
          page: 9999,
          limit: 10,
        });
      const assert = new AssertionEngine();
      const mapped = AberrationEntryMapper.mapData(responseBody.data);

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Schema Validation", () =>
        assertZodSchema(AberrationEntrySuccessResponseSchema, responseBody),
      );
      validation.execute("Pagination", () => validator.validatePagination(mapped));
      validation.execute("Empty page beyond total", () => {
        expect(mapped.pagination.page).toBe(9999);
        if (mapped.pagination.total <= (9999 - 1) * mapped.pagination.limit) {
          expect(mapped.rows.length).toBe(0);
        }
      });
      validation.printSummary("EENLTMT — Page Beyond Total", responseTime);
    },
  );

  test(
    "IND-REV-ABE-EEN-EDGE-002 — Single-page result: total equals returned records",
    { tag: ["@revenue-protection", "@aberration-entry-eenltmt", "@edge"] },
    async ({ authenticatedApi, obs }) => {
      await applyAllureTestCaseId("IND-REV-ABE-EEN-EDGE-002");
      const api = new AberrationEntryApi(authenticatedApi);
      const validation = new ValidationEngine(obs);
      const validator = new AberrationEntryValidator();
      const query = { ...aberrationEntryEenltmtDefaultQuery, page: 1, limit: 100 };
      const { rawResponse, responseBody, responseTime } =
        await api.getAberrationEntry(query);
      const assert = new AssertionEngine();
      const mapped = AberrationEntryMapper.mapData(responseBody.data);

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, aberrationEntryMaxResponseTimeMs),
      );
      validation.execute("Pagination", () => validator.validatePagination(mapped));
      validation.execute("Month/Year Echo", () => {
        validator.validateMonthEcho(mapped, query);
        validator.validateYearEcho(mapped, query);
      });
      validation.printSummary("EENLTMT — Single Page Total Match", responseTime);
    },
  );

  test(
    "IND-REV-ABE-EEN-EDGE-003 — Filter combination returning zero rows",
    { tag: ["@revenue-protection", "@aberration-entry-eenltmt", "@edge"] },
    async ({ authenticatedApi, obs }) => {
      await applyAllureTestCaseId("IND-REV-ABE-EEN-EDGE-003");
      const api = new AberrationEntryApi(authenticatedApi);
      const validation = new ValidationEngine(obs);
      const { rawResponse, responseBody, responseTime } =
        await api.getAberrationEntry(aberrationEntryEenltmtZeroRowsQuery);
      const assert = new AssertionEngine();
      const mapped = AberrationEntryMapper.mapData(responseBody.data);

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Empty success grid", () => {
        expect(responseBody.success).toBeTruthy();
        expect(mapped.rows.length).toBe(0);
        expect(mapped.pagination.total).toBe(0);
        expect(mapped.pagination.totalPages).toBe(0);
      });
      validation.printSummary("EENLTMT — Zero Rows Filter", responseTime);
    },
  );

  test(
    "IND-REV-ABE-EEN-EDGE-004 — Unfiltered query may span multiple months",
    { tag: ["@revenue-protection", "@aberration-entry-eenltmt", "@edge"] },
    async ({ authenticatedApi, obs }) => {
      await applyAllureTestCaseId("IND-REV-ABE-EEN-EDGE-004");
      const api = new AberrationEntryApi(authenticatedApi);
      const validation = new ValidationEngine(obs);
      const { rawResponse, responseBody, responseTime } =
        await api.getAberrationEntry(aberrationEntryEenltmtDefaultQuery);
      const assert = new AssertionEngine();
      const mapped = AberrationEntryMapper.mapData(responseBody.data);

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Multi-month dataset", () => {
        if (mapped.pagination.total <= 1) {
          return;
        }
        const distinctMonths = new Set(mapped.rows.map((row) => row.month));
        expect(distinctMonths.size).toBeGreaterThan(1);
      });
      validation.printSummary("EENLTMT — Multi-Month Unfiltered", responseTime);
    },
  );
});
