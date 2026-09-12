import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { ConsumptionCompareApi } from "../Api/consumptioncompare.api";
import { mapConsumptionCompareResponse } from "../Mapper/consumptioncompare.mapper";
import { ConsumptionCompareValidator } from "../Validator/consumptioncompare.validator";
import {
  CONSUMPTION_COMPARE_COVERAGE_GATED_MISSING_MONTHS,
  CONSUMPTION_COMPARE_COVERAGE_GATED_TYPES,
  consumptionCompareLastMonthData,
} from "../Data/consumptioncompare.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { CONSUMPTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import {
  expectedCommercialPageRecordCount,
  formatCommercialMetricKey,
  getCommercialPaginatedView,
  logCommercialPageCounts,
} from "../Validator/commercial-analysis.shared";
import { shouldSkipCommercialResponse } from "../utils/commercial-request.helper";
import { writeCommercialDuplicateSnapshot } from "../utils/commercial-duplicate-inventory";
import { CommercialCommonValidator } from "../Validator/commercial-common.validator";
import type { ConsumptionCompareRow } from "../Mapper/consumptioncompare.mapper";

function compareRowIdentity(row: ConsumptionCompareRow): string {
  return `${row.meterLookupId}|${row.msn}|${row.currKwh.toFixed(2)}|${row.prevKwh.toFixed(2)}`;
}

test.describe("Consumption Compare report", () => {
  test.describe.configure({ retries: 2 });
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);

  test(
    "Consumption Compare (Last Month) — this month's usage is less than half of last month's",
    { tag: ["@smoke", "@consumption-compare"] },
    async ({ authenticatedApi }, testInfo) => {
      const api = new ConsumptionCompareApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getConsumptionCompare(consumptionCompareLastMonthData);

      if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
        test.skip(
          true,
          `Compare Last Month unavailable (HTTP ${rawResponse.status()})`,
        );
        return;
      }

      const defectContext = {
        module: "COMMERICIAL-ANALYSIS",
        endpoint: rawResponse.url(),
        requestParams: consumptionCompareLastMonthData,
        responseStatus: rawResponse.status(),
        responseBody,
        expectedBehavior:
          "Grid { currKwh = New kWh, prevKwh = Old kWh }. prevKwh > 0 and currKwh < 50% of prevKwh (currKwh may be 0). Unique meterLookupId. This report has no duplicate records. connectionCategory is stripped.",
      };

      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new ConsumptionCompareValidator();

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

        const rows = mapConsumptionCompareResponse(responseBody);

        validation.execute("Response Validation", () =>
          validator.validateResponse(responseBody),
        );
        validation.execute("Grid Columns", () =>
          validator.validateLastMonthGridColumns(responseBody),
        );
        validation.execute("Query Params Validation", () =>
          validator.validateQueryParams(
            responseBody,
            consumptionCompareLastMonthData,
          ),
        );
        validation.execute("Report Type Validation", () =>
          validator.validateReportForType(
            responseBody,
            consumptionCompareLastMonthData.type,
          ),
        );
        validation.execute("Has Data Validation", () =>
          validator.validateHasData(
            responseBody,
            consumptionCompareLastMonthData,
          ),
        );
        validation.execute("Mandatory Fields Validation", () =>
          validator.validateMandatoryFields(rows),
        );
        validation.execute("Consumption Compare Business Rules", () =>
          validator.validateBusinessRules(
            rows,
            consumptionCompareLastMonthData.type,
          ),
        );
        validation.execute("Duplicate contract", () =>
          validator.validateDuplicateContract(rows),
        );
        validation.execute("Pagination Validation", () =>
          validator.validatePagination(
            responseBody,
            consumptionCompareLastMonthData,
          ),
        );
        validation.execute("Total Count Validation", () =>
          validator.validateTotalCount(
            responseBody,
            consumptionCompareLastMonthData,
          ),
        );
      } finally {
        ApiValidationHelper.finalize(validation, {
          apiName: "Consumption Compare API",
          responseTime,
          testInfo,
          defectContext,
        });
      }
    },
  );

  test(
    "Consumption Compare (Last Month) — household and non-household lists are the same (connection type filter is not applied)",
    { tag: ["@consumption-compare", "@commercial"] },
    async ({ authenticatedApi }, testInfo) => {
      const api = new ConsumptionCompareApi(authenticatedApi);
      const domesticQuery = {
        ...consumptionCompareLastMonthData,
        connectionCategory: "domestic" as const,
      };
      const nonDomesticQuery = {
        ...consumptionCompareLastMonthData,
        connectionCategory: "non-domestic" as const,
      };

      let domesticRes;
      let nonDomesticRes;
      try {
        [domesticRes, nonDomesticRes] = await Promise.all([
          api.getConsumptionCompare(domesticQuery),
          api.getConsumptionCompare(nonDomesticQuery),
        ]);
      } catch (error) {
        test.skip(
          true,
          `Compare Last Month connectionCategory check timed out: ${error instanceof Error ? error.message : String(error)}`,
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
          "Last Month strips connectionCategory. domestic total === non-domestic total. Page-1 meter identities match.",
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
            `Compare Last Month connectionCategory check unavailable (HTTP ${statuses.join("/")})`,
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
          label: "Compare Last Month domestic (filter ignored)",
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
          label: "Compare Last Month non-domestic (filter ignored)",
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
        const validator = new ConsumptionCompareValidator();
        const domesticRows = mapConsumptionCompareResponse(domesticRes.responseBody);
        const nonDomesticRows = mapConsumptionCompareResponse(
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
            expect(domesticRows.map(compareRowIdentity)).toEqual(
              nonDomesticRows.map(compareRowIdentity),
            );
          },
        );
      } finally {
        ApiValidationHelper.finalize(validation, {
          apiName: "Consumption Compare API (connectionCategory ignored)",
          responseTime,
          testInfo,
          defectContext,
        });
      }
    },
  );

  for (const type of CONSUMPTION_COMPARE_COVERAGE_GATED_TYPES) {
    for (const connectionCategory of [undefined, "domestic", "non-domestic"] as const) {
      const categoryLabel =
        connectionCategory === "domestic"
          ? "household"
          : connectionCategory === "non-domestic"
            ? "non-household"
            : "all connections";
      test(
        `${type} — ${categoryLabel}: billing data is not ready yet`,
        { tag: ["@consumption-compare", "@commercial"] },
        async ({ authenticatedApi }) => {
          const api = new ConsumptionCompareApi(authenticatedApi);
          const { rawResponse, responseBody } = await api.getConsumptionCompare(
            {
              ...consumptionCompareLastMonthData,
              type,
              ...(connectionCategory ? { connectionCategory } : {}),
            },
            { maxAttempts: 1 },
          );
          CommercialCommonValidator.validateBillingPeriodNotReady(
            rawResponse.status(),
            responseBody,
            CONSUMPTION_COMPARE_COVERAGE_GATED_MISSING_MONTHS[type],
          );
        },
      );
    }
  }

  test.describe("Consumption Compare (Last Month) — first and last page have no duplicate meters", () => {
    test.describe.configure({ retries: 0 });
    test(
      "Consumption Compare (Last Month) — first and last page have no duplicate meters",
      { tag: ["@consumption-compare", "@commercial"] },
      async ({ authenticatedApi }, testInfo) => {
        const api = new ConsumptionCompareApi(authenticatedApi);
        const validator = new ConsumptionCompareValidator();
        const validation = new ValidationEngine();
        const query = consumptionCompareLastMonthData;
        const first = await api.getConsumptionCompare(query);
        if (shouldSkipCommercialResponse(first.rawResponse.status(), first.responseBody)) {
          test.skip(
            true,
            `Compare Last Month uniqueness unavailable (HTTP ${first.rawResponse.status()})`,
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
        const lastPage = Math.max(1, view.totalPages);
        const [last, domesticFirst, nonDomesticFirst] = await Promise.all([
          lastPage === 1
            ? Promise.resolve(first)
            : api.getConsumptionCompare({ ...query, page: lastPage }),
          api.getConsumptionCompare({
            ...query,
            connectionCategory: "domestic",
            page: 1,
          }),
          api.getConsumptionCompare({
            ...query,
            connectionCategory: "non-domestic",
            page: 1,
          }),
        ]);
        expect(domesticFirst.rawResponse.status()).toBe(200);
        expect(nonDomesticFirst.rawResponse.status()).toBe(200);
        const domesticView = getCommercialPaginatedView(
          domesticFirst.responseBody.data,
          pageQuery,
        );
        const nonDomesticView = getCommercialPaginatedView(
          nonDomesticFirst.responseBody.data,
          pageQuery,
        );
        expect(domesticView.totalCount).toBe(view.totalCount);
        expect(nonDomesticView.totalCount).toBe(view.totalCount);
        const [domesticLast, nonDomesticLast] = await Promise.all([
          lastPage === 1
            ? Promise.resolve(domesticFirst)
            : api.getConsumptionCompare({
                ...query,
                connectionCategory: "domestic",
                page: lastPage,
              }),
          lastPage === 1
            ? Promise.resolve(nonDomesticFirst)
            : api.getConsumptionCompare({
                ...query,
                connectionCategory: "non-domestic",
                page: lastPage,
              }),
        ]);
        for (const res of [last, domesticLast, nonDomesticLast]) {
          expect(res.rawResponse.status()).toBe(200);
        }
        validation.execute("Unfiltered page 1 uniqueness", () => {
          validator.validateDuplicateContract(
            mapConsumptionCompareResponse(first.responseBody),
          );
        });
        validation.execute(`Unfiltered last page ${lastPage} uniqueness`, () => {
          validator.validateDuplicateContract(
            mapConsumptionCompareResponse(last.responseBody),
          );
        });
        validation.execute("Domestic page 1 uniqueness", () => {
          validator.validateDuplicateContract(
            mapConsumptionCompareResponse(domesticFirst.responseBody),
          );
        });
        validation.execute(`Domestic last page ${lastPage} uniqueness`, () => {
          validator.validateDuplicateContract(
            mapConsumptionCompareResponse(domesticLast.responseBody),
          );
        });
        validation.execute("Non-domestic page 1 uniqueness", () => {
          validator.validateDuplicateContract(
            mapConsumptionCompareResponse(nonDomesticFirst.responseBody),
          );
        });
        validation.execute(`Non-domestic last page ${lastPage} uniqueness`, () => {
          validator.validateDuplicateContract(
            mapConsumptionCompareResponse(nonDomesticLast.responseBody),
          );
        });
        validation.execute(
          "Domestic last-page meters equal non-domestic last-page meters",
          () => {
            expect(
              mapConsumptionCompareResponse(domesticLast.responseBody).map(
                compareRowIdentity,
              ),
            ).toEqual(
              mapConsumptionCompareResponse(nonDomesticLast.responseBody).map(
                compareRowIdentity,
              ),
            );
          },
        );
        ApiValidationHelper.finalize(validation, {
          apiName: "Consumption Compare Last Month first/last uniqueness",
          responseTime: first.responseTime,
          testInfo,
          defectContext: {
            module: "COMMERICIAL-ANALYSIS",
            endpoint: first.rawResponse.url(),
            requestParams: { ...query, lastPage },
            responseStatus: first.rawResponse.status(),
            responseBody: first.responseBody,
            expectedBehavior:
              "meterLookupId unique. This report has no duplicate records.",
          },
        });
      },
    );

    test(
      "Consumption Compare (Last Month) — every page is checked so the same meter is not listed twice on the same DTR",
      { tag: ["@consumption-compare", "@commercial"] },
      async ({ authenticatedApi }, testInfo) => {
        const api = new ConsumptionCompareApi(authenticatedApi);
        const validator = new ConsumptionCompareValidator();
        const validation = new ValidationEngine();
        const pageSize = 500;
        const query = {
          ...consumptionCompareLastMonthData,
          page: 1,
          pageSize,
        };
        const first = await api.getConsumptionCompare(query);
        if (shouldSkipCommercialResponse(first.rawResponse.status(), first.responseBody)) {
          test.skip(
            true,
            `Compare Last Month uniqueness scan unavailable (HTTP ${first.rawResponse.status()})`,
          );
          return;
        }
        expect(first.rawResponse.status()).toBe(200);
        const view = getCommercialPaginatedView(first.responseBody.data, query);
        const allRows = [...mapConsumptionCompareResponse(first.responseBody)];
        for (let page = 2; page <= view.totalPages; page += 1) {
          const next = await api.getConsumptionCompare({
            ...query,
            page,
          });
          expect(next.rawResponse.status()).toBe(200);
          allRows.push(...mapConsumptionCompareResponse(next.responseBody));
        }
        expect(allRows.length, "Last Month collected rows").toBe(view.totalCount);
        writeCommercialDuplicateSnapshot(
          consumptionCompareLastMonthData.type,
          allRows,
          (row) =>
            [
              formatCommercialMetricKey((row as { currKwh?: number }).currKwh),
              formatCommercialMetricKey((row as { prevKwh?: number }).prevKwh),
            ].join("|"),
        );
        validation.execute("Collected uniqueness", () => {
          validator.validateDuplicateContract(allRows);
          validator.validateBusinessRules(
            allRows,
            consumptionCompareLastMonthData.type,
          );
        });
        ApiValidationHelper.finalize(validation, {
          apiName: "Consumption Compare Last Month uniqueness across all pages",
          responseTime: first.responseTime,
          testInfo,
          defectContext: {
            module: "COMMERICIAL-ANALYSIS",
            endpoint: first.rawResponse.url(),
            requestParams: { ...query, totalPages: view.totalPages },
            responseStatus: first.rawResponse.status(),
            responseBody: { total: view.totalCount, collected: allRows.length },
            expectedBehavior:
              "meterLookupId unique across the full Last Month grid. This report has no duplicate records.",
          },
        });
      },
    );
  });
});
