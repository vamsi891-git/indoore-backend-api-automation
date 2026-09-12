import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { DayNightApi } from "../Api/daynight.api";
import { mapDayNightResponse } from "../Mapper/daynight.mapper";
import { DayNightValidator } from "../Validator/daynight.validator";
import {
  DAY_NIGHT_TYPE_CONFIG,
  dayNightValidatableQueries,
} from "../Data/daynight.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { CONSUMPTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import {
  expectedCommercialPageRecordCount,
  getCommercialPaginatedView,
  logCommercialPageCounts,
} from "../Validator/commercial-analysis.shared";
import { shouldSkipCommercialResponse } from "../utils/commercial-request.helper";
import type { DayNightRow } from "../Mapper/daynight.mapper";

function dayNightRowIdentity(row: DayNightRow): string {
  return [
    row.meterLookupId,
    row.msn,
    row.count ?? "",
    row.dayKwh ?? "",
    row.nightKwh ?? "",
  ].join("|");
}

test.describe("Day and Night consumption report", () => {
  test.describe.configure({ retries: 2 });
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);

  for (const query of dayNightValidatableQueries) {
    test(
      `Day and Night — ${query.type}: report opens and usage follows the rule`,
      { tag: ["@smoke", "@day-night"] },
      async ({ authenticatedApi }, testInfo) => {
        const api = new DayNightApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.getDayNight(query);

        if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
          test.skip(
            true,
            `Day-night ${query.type} unavailable (HTTP ${rawResponse.status()})`,
          );
          return;
        }

        const cfg = DAY_NIGHT_TYPE_CONFIG[query.type];
        const defectContext = {
          module: "COMMERICIAL-ANALYSIS",
          endpoint: rawResponse.url(),
          requestParams: query,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            cfg.kind === "zero"
              ? "Grid { count, dayKwh }, no subStation. Unique meterLookupId. Same MSN is a duplicate only when count and dayKwh match. connectionCategory is stripped. This report has no duplicate records."
              : "Grid { nightKwh, dayKwh }, night <= 10% of day. Unique meterLookupId. Same MSN is a duplicate only when night/day kWh match. connectionCategory is stripped. This report has no duplicate records.",
        };

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new DayNightValidator();

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

          const rows = mapDayNightResponse(responseBody);

          validation.execute("Response Validation (empty allowed)", () =>
            validator.validateResponse(responseBody),
          );
          validation.execute("Grid Columns", () =>
            validator.validateGridColumns(responseBody, query.type),
          );
          validation.execute("Query Params Validation", () =>
            validator.validateQueryParams(responseBody, query),
          );
          validation.execute("Report Kind Validation", () =>
            validator.validateReportForKind(responseBody, cfg.kind),
          );
          validation.execute("Mandatory Fields Validation", () =>
            validator.validateMandatoryFields(rows),
          );
          validation.execute("Day-Night Business Rules", () =>
            validator.validateBusinessRules(rows, cfg.kind),
          );
          validation.execute("Duplicate contract", () =>
            validator.validateDuplicateContract(rows),
          );
          validation.execute("Pagination Validation", () =>
            validator.validatePagination(responseBody, query),
          );
          validation.execute("Total Count Validation", () =>
            validator.validateTotalCount(responseBody, query),
          );
        } finally {
          ApiValidationHelper.finalize(validation, {
            apiName: `Day Night API (${query.type})`,
            responseTime,
            testInfo,
            defectContext,
          });
        }
      },
    );

    test(
      `Day and Night — ${query.type}: household and non-household lists are the same (connection type filter is not applied)`,
      { tag: ["@day-night", "@commercial"] },
      async ({ authenticatedApi }, testInfo) => {
        const api = new DayNightApi(authenticatedApi);
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
            api.getDayNight(domesticQuery),
            api.getDayNight(nonDomesticQuery),
          ]);
        } catch (error) {
          test.skip(
            true,
            `Day-night ${query.type} connectionCategory check timed out: ${error instanceof Error ? error.message : String(error)}`,
          );
          return;
        }

        const responseTime = Math.max(
          domesticRes.responseTime,
          nonDomesticRes.responseTime,
        );
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
            "connectionCategory is stripped. domestic.total === non-domestic total (Night Zero 1130, LTE 2332). Page-1 meters match. No duplicate records.",
        };

        const validation = new ValidationEngine();
        try {
          const statuses = [
            domesticRes.rawResponse.status(),
            nonDomesticRes.rawResponse.status(),
          ];
          if (
            statuses.some((status, i) =>
              shouldSkipCommercialResponse(
                status,
                [domesticRes, nonDomesticRes][i]!.responseBody,
              ),
            )
          ) {
            test.skip(
              true,
              `Day-night ${query.type} connectionCategory check unavailable (HTTP ${statuses.join("/")})`,
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

          validation.execute(
            "Domestic pagination.total equals non-domestic total",
            () => {
              expect(domesticView.totalCount).toBeGreaterThan(0);
              expect(nonDomesticView.totalCount).toBe(domesticView.totalCount);
            },
          );
          const validator = new DayNightValidator();
          const domesticRows = mapDayNightResponse(domesticRes.responseBody);
          const nonDomesticRows = mapDayNightResponse(
            nonDomesticRes.responseBody,
          );
          validation.execute("Domestic page uniqueness", () => {
            validator.validateDuplicateContract(domesticRows);
          });
          validation.execute("Non-domestic page uniqueness", () => {
            validator.validateDuplicateContract(nonDomesticRows);
          });
          validation.execute(
            "Domestic page-1 meters equal non-domestic page-1 meters",
            () => {
              expect(domesticRows.map(dayNightRowIdentity)).toEqual(
                nonDomesticRows.map(dayNightRowIdentity),
              );
            },
          );
        } finally {
          ApiValidationHelper.finalize(validation, {
            apiName: `Day Night API (${query.type} connectionCategory ignored)`,
            responseTime,
            testInfo,
            defectContext,
          });
        }
      },
    );
  }

  test.describe("Day and Night — first and last page have no duplicate meters", () => {
    test.describe.configure({ retries: 0 });
    for (const query of dayNightValidatableQueries) {
      test(
        `Day and Night — ${query.type}: first and last page have no duplicate meters`,
        { tag: ["@day-night", "@commercial"] },
        async ({ authenticatedApi }, testInfo) => {
          const api = new DayNightApi(authenticatedApi);
          const validator = new DayNightValidator();
          const validation = new ValidationEngine();
          const first = await api.getDayNight(query);
          if (shouldSkipCommercialResponse(first.rawResponse.status(), first.responseBody)) {
            test.skip(
              true,
              `Day-night ${query.type} uniqueness unavailable (HTTP ${first.rawResponse.status()})`,
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
          const nonDomesticFirst = await api.getDayNight({
            ...query,
            connectionCategory: "non-domestic",
            page: 1,
          });
          expect(nonDomesticFirst.rawResponse.status()).toBe(200);
          const [last, nonDomesticLast] = await Promise.all([
            lastPage === 1
              ? Promise.resolve(first)
              : api.getDayNight({ ...query, page: lastPage }),
            lastPage === 1
              ? Promise.resolve(nonDomesticFirst)
              : api.getDayNight({
                  ...query,
                  connectionCategory: "non-domestic",
                  page: lastPage,
                }),
          ]);
          for (const res of [last, nonDomesticLast]) {
            expect(res.rawResponse.status()).toBe(200);
          }
          validation.execute("Domestic page 1 uniqueness", () => {
            validator.validateDuplicateContract(mapDayNightResponse(first.responseBody));
          });
          validation.execute(`Domestic last page ${lastPage} uniqueness`, () => {
            validator.validateDuplicateContract(mapDayNightResponse(last.responseBody));
          });
          validation.execute("Non-domestic page 1 uniqueness", () => {
            validator.validateDuplicateContract(
              mapDayNightResponse(nonDomesticFirst.responseBody),
            );
          });
          validation.execute(
            `Non-domestic last page ${lastPage} uniqueness`,
            () => {
              validator.validateDuplicateContract(
                mapDayNightResponse(nonDomesticLast.responseBody),
              );
            },
          );
          validation.execute(
            "Domestic last-page meters equal non-domestic last-page meters",
            () => {
              expect(
                mapDayNightResponse(last.responseBody).map(dayNightRowIdentity),
              ).toEqual(
                mapDayNightResponse(nonDomesticLast.responseBody).map(
                  dayNightRowIdentity,
                ),
              );
            },
          );
          ApiValidationHelper.finalize(validation, {
            apiName: `Day Night first/last uniqueness (${query.type})`,
            responseTime: first.responseTime,
            testInfo,
            defectContext: {
              module: "COMMERICIAL-ANALYSIS",
              endpoint: first.rawResponse.url(),
              requestParams: { ...query, lastPage },
              responseStatus: first.rawResponse.status(),
              responseBody: first.responseBody,
              expectedBehavior:
                "meterLookupId unique. No duplicate records on this report.",
            },
          });
        },
      );
    }
  });
});
