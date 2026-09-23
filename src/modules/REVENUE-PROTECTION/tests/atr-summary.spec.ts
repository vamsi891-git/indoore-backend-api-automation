import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { AtrSummaryApi } from "../Api/atr-summary.api";
import {
  atrSummaryCircleSmokeCases,
  atrSummaryMaxResponseTimeMs,
  ATR_SUMMARY_MONTH,
  ATR_SUMMARY_YEAR,
} from "../Data/atr-summary.data";
import { AtrSummaryMapper } from "../Mapper/atr-summary.mapper";
import type { AtrSummaryQuery } from "../Mapper/atr-summary.types";
import { AtrSummaryValidator } from "../Validator/atr-summary.validator";
import { AtrSummarySuccessResponseSchema } from "../schemas/atr-summary.schemas";

test.describe("Revenue Protection — ATR Summary API", () => {
  test.describe.configure({ retries: 1, mode: "serial" });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  for (const testCase of atrSummaryCircleSmokeCases) {
    test(testCase.testName, { tag: [...testCase.tags] }, async ({ authenticatedApi }) => {
      await applyAllureTestCaseId(testCase.testCaseId);
      const api = new AtrSummaryApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getAtrSummary(testCase.query);
      await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime,
      );
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new AtrSummaryValidator();
      const mapped = AtrSummaryMapper.mapData(responseBody.data);

      if (testCase.nonEmptyExpected && mapped.pagination.total === 0) {
        test.skip(
          true,
          `No atr-summary rows for ${testCase.query.reportType} year=${testCase.query.year}`,
        );
      }

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Content Validation", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, atrSummaryMaxResponseTimeMs),
      );
      validation.execute("Security Validation", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );
      validation.execute("Schema Validation", () =>
        assertZodSchema(AtrSummarySuccessResponseSchema, responseBody),
      );
      validation.execute("Response", () => validator.validateResponse(responseBody));
      if (testCase.query.reportType === "billingEfficiency") {
        validation.execute("Columns", () =>
          validator.validateBillingEfficiencyColumns(mapped, testCase.hierarchyLevel),
        );
      } else {
        validation.execute("Columns present", () => {
          expect(mapped.columns.length).toBeGreaterThan(0);
        });
      }
      validation.execute("Column Keys Match Rows", () =>
        validator.validateColumnKeysMatchRows(mapped),
      );
      validation.execute("Rows Exist", () => validator.validateRowsExist(mapped));
      validation.execute("Pagination", () => validator.validatePagination(mapped));
      validation.execute("Unique Row IDs", () => validator.validateUniqueRowIds(mapped));
      validation.execute("Query Echo", () => validator.validateQueryEcho(mapped, testCase.query));
      validation.execute("Level Echo", () =>
        validator.validateLevelEcho(mapped, String(testCase.query.hierarchyLevel)),
      );
      validation.printSummary(testCase.testName, responseTime);
    });
  }

  test(
    `Drill billingEfficiency circle→division→zone→feeder (${ATR_SUMMARY_YEAR}-${String(ATR_SUMMARY_MONTH).padStart(2, "0")})`,
    {
      tag: ["@smoke", "@atr-summary", "@atr-summary-billingEfficiency", "@atr-summary-drill"],
    },
    async ({ authenticatedApi }) => {
      await applyAllureTestCaseId("IND-REV-ATR-SUM-BE-DRILL");
      const api = new AtrSummaryApi(authenticatedApi);
      const validator = new AtrSummaryValidator();
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      async function fetchLevel(query: AtrSummaryQuery, label: string) {
        const { rawResponse, responseBody, responseTime } = await api.getAtrSummary(query);
        await PerformanceTracker.track(rawResponse, label, rawResponse.url(), responseTime);
        validation.execute(`${label} Status`, () =>
          assert.validateStatusCode(rawResponse, 200, responseBody),
        );
        validation.execute(`${label} Schema`, () =>
          assertZodSchema(AtrSummarySuccessResponseSchema, responseBody),
        );
        const mapped = AtrSummaryMapper.mapData(responseBody.data);
        validation.execute(`${label} Columns`, () =>
          validator.validateBillingEfficiencyColumns(
            mapped,
            query.hierarchyLevel as "circle" | "division" | "zone" | "feeder",
          ),
        );
        validation.execute(`${label} Query Echo`, () => validator.validateQueryEcho(mapped, query));
        validation.execute(`${label} Level Echo`, () =>
          validator.validateLevelEcho(mapped, String(query.hierarchyLevel)),
        );
        validation.execute(`${label} Rows`, () => validator.validateRowsExist(mapped));
        return mapped;
      }

      const circle = await fetchLevel(
        {
          year: ATR_SUMMARY_YEAR,
          reportType: "billingEfficiency",
          hierarchyLevel: "circle",
          month: ATR_SUMMARY_MONTH,
          page: 1,
          limit: 20,
        },
        "circle",
      );
      expect(circle.rows.length).toBeGreaterThan(0);
      const circleRow = circle.rows[0];
      const circleId = String(circleRow.hierarchyId ?? circleRow.circleId);
      expect(circleId.trim()).not.toEqual("");

      const division = await fetchLevel(
        {
          year: ATR_SUMMARY_YEAR,
          reportType: "billingEfficiency",
          hierarchyLevel: "division",
          month: String(ATR_SUMMARY_MONTH).padStart(2, "0"),
          parentId: circleId,
          circleId,
          page: 1,
          limit: 20,
        },
        "division",
      );
      validation.execute("Five divisions", () => validator.validateExpectedDivisions(division));

      const divisionRow = division.rows.find(
        (row) => String(row.division).toUpperCase() === "CENTRAL",
      );
      expect(divisionRow, "CENTRAL division row").toBeDefined();
      const divisionId = String(divisionRow!.hierarchyId ?? divisionRow!.divisionId);

      const zone = await fetchLevel(
        {
          year: ATR_SUMMARY_YEAR,
          reportType: "billingEfficiency",
          hierarchyLevel: "zone",
          month: String(ATR_SUMMARY_MONTH).padStart(2, "0"),
          parentId: divisionId,
          circleId,
          divisionId,
          page: 1,
          limit: 20,
        },
        "zone",
      );
      expect(zone.rows.length).toBeGreaterThan(0);
      const zoneRow = zone.rows[0];
      const zoneId = String(zoneRow.hierarchyId ?? zoneRow.zoneId);

      const feeder = await fetchLevel(
        {
          year: ATR_SUMMARY_YEAR,
          reportType: "billingEfficiency",
          hierarchyLevel: "feeder",
          month: String(ATR_SUMMARY_MONTH).padStart(2, "0"),
          parentId: zoneId,
          circleId,
          divisionId,
          zoneId,
          page: 1,
          limit: 20,
        },
        "feeder",
      );
      expect(feeder.rows.length).toBeGreaterThan(0);
      feeder.rows.forEach((row) => {
        expect(row.canDrillDown).toBe(false);
      });

      validation.printSummary("atr-summary billingEfficiency drill", 0);
    },
  );
});
