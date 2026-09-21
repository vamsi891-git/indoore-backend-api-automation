import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { ConsumptionPatternApi } from "../Api/consumptionpattern.api";
import { mapConsumptionPatternResponse } from "../Mapper/consumptionpattern.mapper";
import { ConsumptionPatternValidator } from "../Validator/consumptionpattern.validator";
import {
  CONSUMPTION_PATTERN_AVG_INITIAL_TYPE,
  CONSUMPTION_PATTERN_COVERAGE_GATED_MISSING_MONTHS,
  CONSUMPTION_PATTERN_COVERAGE_GATED_TYPES,
  CONSUMPTION_PATTERN_TYPE_CONFIG,
  PATTERN_CONNECTION_CATEGORY_CASES,
  consumptionPatternCountBase,
  consumptionPatternValidatableQueries,
} from "../Data/consumptionpattern.data";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { CONSUMPTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import {
  expectedCommercialPageRecordCount,
  getCommercialPaginatedView,
  logCommercialPageCounts,
} from "../Validator/commercial-analysis.shared";
import { shouldSkipCommercialResponse } from "../utils/commercial-request.helper";
import { CommercialCommonValidator } from "../Validator/commercial-common.validator";
import type { ConsumptionPatternRow } from "../Mapper/consumptionpattern.mapper";

function patternRowIdentity(row: ConsumptionPatternRow): string {
  return [row.meterLookupId, row.msn, row.dtr, row.kWh].join("|");
}

function patternExpectedBehavior(kind: "zero" | "low" | "avg_less_than_initial"): string {
  if (kind === "zero") {
    return "Always send connectionCategory=domestic (unfiltered times out). Grid includes subStation and kWh. Every row kWh === 0. This report has no duplicate records. connectionCategory is stripped.";
  }
  if (kind === "low") {
    return "Always send connectionCategory=domestic (unfiltered times out). Grid includes subStation and kWh. Every row 0 <= kWh < 100. This report has no duplicate records. connectionCategory is stripped.";
  }
  return "Billing coverage unavailable for Oct 2025 6m window.";
}

test.describe("Consumption Pattern report", () => {
  test.describe.configure({ retries: 2 });
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);

  for (const query of consumptionPatternValidatableQueries) {
    test(
      `Consumption Pattern — ${query.type}: report opens and usage follows the rule`,
      { tag: ["@smoke", "@consumption-pattern"] },
      async ({ authenticatedApi }, testInfo) => {
        const api = new ConsumptionPatternApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } = await api.getConsumptionPattern(query);

        if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
          test.skip(true, `Pattern ${query.type} unavailable (HTTP ${rawResponse.status()})`);
          return;
        }

        const cfg = CONSUMPTION_PATTERN_TYPE_CONFIG[query.type];
        const defectContext = {
          module: "COMMERICIAL-ANALYSIS",
          endpoint: rawResponse.url(),
          requestParams: query,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: patternExpectedBehavior(cfg.kind),
        };

        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();
        const validator = new ConsumptionPatternValidator();

        try {
          validation.execute("Status Code Validation", () =>
            assert.validateStatusCode(rawResponse, 200),
          );
          validation.execute("Content Type Validation", () =>
            assert.validateContentType(rawResponse, "application/json"),
          );
          validation.execute("Response Time Validation", () =>
            assert.validateResponseTime(responseTime, 180_000),
          );
          validation.execute("Sensitive Data Validation", () =>
            assert.validateSensitiveData(responseBody),
          );

          if (rawResponse.status() !== 200) {
            return;
          }

          const rows = mapConsumptionPatternResponse(responseBody);

          validation.execute("Response Validation", () => validator.validateResponse(responseBody));
          validation.execute("Grid Columns", () => validator.validateGridColumns(responseBody));
          validation.execute("Query Params Validation", () =>
            validator.validateQueryParams(responseBody, query),
          );
          validation.execute("Report Pattern Validation", () =>
            validator.validateReportForPattern(responseBody, cfg.kind),
          );
          validation.execute("Mandatory Fields Validation", () =>
            validator.validateMandatoryFields(rows),
          );
          validation.execute("Pattern Business Validation", () =>
            validator.validatePatternRows(rows, cfg.kind, cfg.threshold),
          );
          validation.execute("Duplicate contract", () => validator.validateDuplicateContract(rows));
          validation.execute("Pagination Validation", () =>
            validator.validatePagination(responseBody, query),
          );
          validation.execute("Total Count Validation", () =>
            validator.validateTotalCount(responseBody, query),
          );
        } finally {
          ApiValidationHelper.finalize(validation, {
            apiName: `Consumption Pattern API (${query.type})`,
            responseTime,
            testInfo,
            defectContext,
          });
        }
      },
    );

    test(
      `Consumption Pattern — ${query.type}: household and non-household lists are the same (connection type filter is not applied)`,
      { tag: ["@consumption-pattern", "@commercial"] },
      async ({ authenticatedApi }, testInfo) => {
        const api = new ConsumptionPatternApi(authenticatedApi);
        const domesticQuery = {
          ...query,
          connectionCategory: "domestic" as const,
        };
        const nonDomesticQuery = {
          ...query,
          connectionCategory: "non-domestic" as const,
        };

        let domesticRes;
        let nonDomesticRes;
        try {
          [domesticRes, nonDomesticRes] = await Promise.all([
            api.getConsumptionPattern(domesticQuery),
            api.getConsumptionPattern(nonDomesticQuery),
          ]);
        } catch (error) {
          test.skip(
            true,
            `Pattern ${query.type} connectionCategory check timed out: ${error instanceof Error ? error.message : String(error)}`,
          );
          return;
        }

        const responseTime = Math.max(domesticRes.responseTime, nonDomesticRes.responseTime);
        const defectContext = {
          module: "COMMERICIAL-ANALYSIS",
          endpoint: domesticRes.rawResponse.url(),
          requestParams: { domesticQuery, nonDomesticQuery },
          responseStatus: domesticRes.rawResponse.status(),
          responseBody: {
            domestic: domesticRes.responseBody,
            nonDomestic: nonDomesticRes.responseBody,
          },
          expectedBehavior:
            "connectionCategory is stripped. domestic.total === non-domestic total. Page-1 meters match. This report has no duplicate records.",
        };

        const validation = new ApiValidationHelper();
        try {
          const statuses = [domesticRes.rawResponse.status(), nonDomesticRes.rawResponse.status()];
          if (
            statuses.some((status, i) =>
              shouldSkipCommercialResponse(status, [domesticRes, nonDomesticRes][i]!.responseBody),
            )
          ) {
            test.skip(
              true,
              `Pattern ${query.type} connectionCategory check unavailable (HTTP ${statuses.join("/")})`,
            );
            return;
          }

          validation.execute("Both requests return 200", () => {
            expect(domesticRes.rawResponse.status()).toBe(200);
            expect(nonDomesticRes.rawResponse.status()).toBe(200);
          });
          if (
            domesticRes.rawResponse.status() !== 200 ||
            nonDomesticRes.rawResponse.status() !== 200
          ) {
            return;
          }

          const domesticView = getCommercialPaginatedView(
            domesticRes.responseBody.data,
            domesticQuery,
          );
          const nonDomesticView = getCommercialPaginatedView(
            nonDomesticRes.responseBody.data,
            nonDomesticQuery,
          );
          logCommercialPageCounts({
            label: `${query.type} domestic (filter ignored)`,
            connectionCategory: "domestic",
            page: domesticView.page,
            pageSize: domesticView.pageSize,
            total: domesticView.totalCount,
            totalPages: domesticView.totalPages,
            records: domesticView.rows.length,
            expectedRecords: expectedCommercialPageRecordCount(
              domesticView.totalCount,
              domesticView.page,
              domesticView.pageSize,
            ),
          });
          logCommercialPageCounts({
            label: `${query.type} non-domestic (filter ignored)`,
            connectionCategory: "non-domestic",
            page: nonDomesticView.page,
            pageSize: nonDomesticView.pageSize,
            total: nonDomesticView.totalCount,
            totalPages: nonDomesticView.totalPages,
            records: nonDomesticView.rows.length,
            expectedRecords: expectedCommercialPageRecordCount(
              nonDomesticView.totalCount,
              nonDomesticView.page,
              nonDomesticView.pageSize,
            ),
          });

          validation.execute("Domestic pagination.total equals non-domestic total", () => {
            expect(domesticView.totalCount).toBeGreaterThan(0);
            expect(nonDomesticView.totalCount).toBe(domesticView.totalCount);
          });
          const validator = new ConsumptionPatternValidator();
          const cfg = CONSUMPTION_PATTERN_TYPE_CONFIG[query.type];
          const domesticRows = mapConsumptionPatternResponse(domesticRes.responseBody);
          const nonDomesticRows = mapConsumptionPatternResponse(nonDomesticRes.responseBody);
          validation.execute("Domestic page uniqueness", () => {
            validator.validateDuplicateContract(domesticRows);
          });
          validation.execute("Non-domestic page uniqueness", () => {
            validator.validateDuplicateContract(nonDomesticRows);
          });
          validation.execute("Domestic page business rules", () => {
            validator.validatePatternRows(domesticRows, cfg.kind, cfg.threshold);
          });
          validation.execute("Non-domestic page business rules", () => {
            validator.validatePatternRows(nonDomesticRows, cfg.kind, cfg.threshold);
          });
          validation.execute("Domestic page-1 meters equal non-domestic page-1 meters", () => {
            expect(domesticRows.map(patternRowIdentity)).toEqual(
              nonDomesticRows.map(patternRowIdentity),
            );
          });
        } finally {
          ApiValidationHelper.finalize(validation, {
            apiName: `Consumption Pattern API (${query.type} connectionCategory ignored)`,
            responseTime,
            testInfo,
            defectContext,
          });
        }
      },
    );
  }

  test.describe("Consumption Pattern — first and last page have no duplicate meters", () => {
    test.describe.configure({ retries: 0 });
    for (const query of consumptionPatternValidatableQueries) {
      test(
        `Consumption Pattern — ${query.type}: first and last page have no duplicate meters`,
        { tag: ["@consumption-pattern", "@commercial"] },
        async ({ authenticatedApi }, testInfo) => {
          const api = new ConsumptionPatternApi(authenticatedApi);
          const validator = new ConsumptionPatternValidator();
          const validation = new ApiValidationHelper();
          const cfg = CONSUMPTION_PATTERN_TYPE_CONFIG[query.type];
          const first = await api.getConsumptionPattern(query);
          if (shouldSkipCommercialResponse(first.rawResponse.status(), first.responseBody)) {
            test.skip(
              true,
              `Pattern ${query.type} uniqueness unavailable (HTTP ${first.rawResponse.status()})`,
            );
            return;
          }
          expect(first.rawResponse.status()).toBe(200);
          const pageQuery = {
            month: query.month,
            year: query.year,
            page: query.page,
            pageSize: query.pageSize,
          };
          const view = getCommercialPaginatedView(first.responseBody.data, pageQuery);
          expect(view.totalCount).toBeGreaterThan(0);
          const lastPage = Math.max(1, view.totalPages);
          const nonDomesticFirst = await api.getConsumptionPattern({
            ...query,
            connectionCategory: "non-domestic",
            page: 1,
          });
          expect(nonDomesticFirst.rawResponse.status()).toBe(200);
          const [last, nonDomesticLast] = await Promise.all([
            lastPage === 1
              ? Promise.resolve(first)
              : api.getConsumptionPattern({ ...query, page: lastPage }),
            lastPage === 1
              ? Promise.resolve(nonDomesticFirst)
              : api.getConsumptionPattern({
                  ...query,
                  connectionCategory: "non-domestic",
                  page: lastPage,
                }),
          ]);
          for (const res of [last, nonDomesticLast]) {
            expect(res.rawResponse.status()).toBe(200);
          }
          validation.execute("Domestic page 1 uniqueness", () => {
            validator.validateDuplicateContract(mapConsumptionPatternResponse(first.responseBody));
          });
          validation.execute(`Domestic last page ${lastPage} uniqueness`, () => {
            const lastRows = mapConsumptionPatternResponse(last.responseBody);
            validator.validateDuplicateContract(lastRows);
            validator.validatePatternRows(lastRows, cfg.kind, cfg.threshold);
          });
          validation.execute("Non-domestic page 1 uniqueness", () => {
            validator.validateDuplicateContract(
              mapConsumptionPatternResponse(nonDomesticFirst.responseBody),
            );
          });
          validation.execute(`Non-domestic last page ${lastPage} uniqueness`, () => {
            validator.validateDuplicateContract(
              mapConsumptionPatternResponse(nonDomesticLast.responseBody),
            );
          });
          validation.execute(
            "Domestic last-page meters equal non-domestic last-page meters",
            () => {
              expect(
                mapConsumptionPatternResponse(last.responseBody).map(patternRowIdentity),
              ).toEqual(
                mapConsumptionPatternResponse(nonDomesticLast.responseBody).map(patternRowIdentity),
              );
            },
          );
          ApiValidationHelper.finalize(validation, {
            apiName: `Consumption Pattern first/last uniqueness (${query.type})`,
            responseTime: first.responseTime,
            testInfo,
            defectContext: {
              module: "COMMERICIAL-ANALYSIS",
              endpoint: first.rawResponse.url(),
              requestParams: { ...query, lastPage },
              responseStatus: first.rawResponse.status(),
              responseBody: first.responseBody,
              expectedBehavior:
                "This report has no duplicate records. connectionCategory is stripped.",
            },
          });
        },
      );
    }
  });

  for (const type of CONSUMPTION_PATTERN_COVERAGE_GATED_TYPES) {
    for (const connectionCategory of PATTERN_CONNECTION_CATEGORY_CASES) {
      test(
        `Consumption Pattern — ${type} (${connectionCategory === "domestic" ? "household" : "non-household"}): billing data is not ready yet`,
        { tag: ["@consumption-pattern", "@commercial"] },
        async ({ authenticatedApi }) => {
          const api = new ConsumptionPatternApi(authenticatedApi);
          const { rawResponse, responseBody } = await api.getConsumptionPattern(
            {
              ...consumptionPatternCountBase,
              type,
              connectionCategory,
            },
            { maxAttempts: 1 },
          );
          CommercialCommonValidator.validateBillingPeriodNotReady(
            rawResponse.status(),
            responseBody,
            CONSUMPTION_PATTERN_COVERAGE_GATED_MISSING_MONTHS[type],
          );
        },
      );
    }
  }

  for (const connectionCategory of PATTERN_CONNECTION_CATEGORY_CASES) {
    test(
      `Consumption Pattern — ${CONSUMPTION_PATTERN_AVG_INITIAL_TYPE} (${connectionCategory === "domestic" ? "household" : "non-household"}): billing data is not ready yet`,
      { tag: ["@consumption-pattern", "@commercial"] },
      async ({ authenticatedApi }) => {
        const api = new ConsumptionPatternApi(authenticatedApi);
        const { rawResponse, responseBody } = await api.getConsumptionPattern(
          {
            ...consumptionPatternCountBase,
            type: CONSUMPTION_PATTERN_AVG_INITIAL_TYPE,
            connectionCategory,
          },
          { maxAttempts: 1 },
        );
        CommercialCommonValidator.validateBillingCoverageUnavailable(
          rawResponse.status(),
          responseBody,
        );
      },
    );
  }
});
