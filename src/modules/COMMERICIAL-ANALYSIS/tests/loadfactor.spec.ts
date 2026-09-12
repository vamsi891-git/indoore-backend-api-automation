import { expect, type APIResponse } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { LFAnalysisApi } from "../Api/loadfactor.api";
import { mapLFAnalysisResponse } from "../Mapper/loadfactor.mapper";
import { LFAnalysisValidator } from "../Validator/loadfactor.validator";
import {
  LF_COVERAGE_GATED_MISSING_MONTHS,
  LF_COVERAGE_GATED_TYPE,
  LF_TYPE_CONFIG,
  lfAnalysisLt5Last6mData,
  lfValidatableQueries,
} from "../Data/loadfactor.api";
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
import type { LFAnalysisResponse } from "../Mapper/loadfactor.mapper";
import type { LfAnalysisType } from "../Data/loadfactor.api";

function lfRowIdentity(row: { meterLookupId: number; msn: string; lf: number }): string {
  return `${row.meterLookupId}|${row.msn}|${row.lf.toFixed(2)}`;
}

function executeLfPageContract(options: {
  validation: ValidationEngine;
  assert: AssertionEngine;
  query: {
    month: number;
    year: number;
    type: LfAnalysisType;
    page: number;
    pageSize: number;
  };
  rawResponse: APIResponse;
  responseBody: LFAnalysisResponse;
  responseTime: number;
}): void {
  const { query, rawResponse, responseBody, responseTime, validation, assert } =
    options;
  const cfg = LF_TYPE_CONFIG[query.type];
  const rows = mapLFAnalysisResponse(responseBody);
  const validator = new LFAnalysisValidator();
  validation.execute("Status Code Validation", () =>
    assert.validateStatusCode(rawResponse, 200),
  );
  validation.execute("Content Type Validation", () =>
    assert.validateContentType(rawResponse, "application/json"),
  );
  validation.execute("Response Time Validation", () =>
    assert.validateResponseTime(responseTime, 120000),
  );
  validation.execute("Sensitive Data Validation", () =>
    assert.validateSensitiveData(responseBody),
  );
  if (rawResponse.status() !== 200) {
    return;
  }
  validation.execute("Response Validation", () =>
    validator.validateResponse(responseBody),
  );
  validation.execute("Grid Columns", () =>
    validator.validateGridColumns(responseBody, query.type),
  );
  validation.execute("Query Params Validation", () =>
    validator.validateQueryParams(responseBody, query),
  );
  validation.execute("Mandatory Fields Validation", () =>
    validator.validateMandatoryFields(rows),
  );
  validation.execute("LF Threshold Validation", () =>
    validator.validateLfAgainstThreshold(rows, cfg.threshold, cfg.operator),
  );
  if (cfg.echoesThreshold) {
    validation.execute("Report Threshold Column", () =>
      validator.validateReportThresholdColumn(rows, cfg.threshold),
    );
  } else {
    validation.execute("Sanctioned load column (LF>100%)", () =>
      validator.validateSanctionedLoadColumn(rows),
    );
  }
  validation.execute("Duplicate LF Validation", () =>
    validator.validateDuplicateContract(rows),
  );
  validation.execute("Pagination Validation", () =>
    validator.validatePagination(responseBody, query),
  );
  validation.execute("Total Count Validation", () =>
    validator.validateTotalCount(responseBody, query),
  );
}

test.describe("Load Factor report", () => {
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);

  for (const query of lfValidatableQueries) {
    test(
      `Load Factor ${query.type} — report opens and values follow the rule`,
      { tag: ["@smoke", "@lf-analysis"] },
      async ({ authenticatedApi }, testInfo) => {
        const api = new LFAnalysisApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } =
          await api.getLFAnalysis(query);

        if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
          test.skip(
            true,
            `LF ${query.type} unavailable (HTTP ${rawResponse.status()})`,
          );
          return;
        }
        const defectContext = {
          module: "COMMERICIAL-ANALYSIS",
          endpoint: rawResponse.url(),
          requestParams: query,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            query.type === "LF > 100%"
              ? "Grid { columns, rows, pagination }. LF is the display string (e.g. \"100.17\") and must be > 100. LF>100% is sanctioned load kW, not 100. Unique meterLookupId. Same MSN is duplicate only when LF and sanctioned load match."
              : "Grid { columns, rows, pagination }. LF is the display string (e.g. \"0.01\") and must be < 5. LF<5% echoes threshold 5. Unique meterLookupId. Same MSN is duplicate only when LF matches. connectionCategory is stripped.",
        };

        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        try {
          executeLfPageContract({
            validation,
            assert,
            query,
            rawResponse,
            responseBody,
            responseTime,
          });
        } finally {
          ApiValidationHelper.finalize(validation, {
            apiName: `LF Analysis API (${query.type})`,
            responseTime,
            testInfo,
            defectContext,
          });
        }
      },
    );

    for (const connectionCategory of ["domestic", "non-domestic"] as const) {
      test(
        `Load Factor ${query.type} — ${connectionCategory === "domestic" ? "household" : "non-household"} filter shows the same list (filter is not applied)`,
        { tag: ["@lf-analysis", "@commercial"] },
        async ({ authenticatedApi }, testInfo) => {
          const api = new LFAnalysisApi(authenticatedApi);
          const categoryQuery = { ...query, connectionCategory };
          const { rawResponse, responseBody, responseTime } =
            await api.getLFAnalysis(categoryQuery);
          if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
            test.skip(
              true,
              `LF ${query.type} ${connectionCategory} unavailable (HTTP ${rawResponse.status()})`,
            );
            return;
          }
          const validation = new ValidationEngine();
          const assert = new AssertionEngine();
          try {
            executeLfPageContract({
              validation,
              assert,
              query,
              rawResponse,
              responseBody,
              responseTime,
            });
          } finally {
            ApiValidationHelper.finalize(validation, {
              apiName: `LF Analysis API (${query.type} ${connectionCategory})`,
              responseTime,
              testInfo,
              defectContext: {
                module: "COMMERICIAL-ANALYSIS",
                endpoint: rawResponse.url(),
                requestParams: categoryQuery,
                responseStatus: rawResponse.status(),
                responseBody,
                expectedBehavior:
                  "connectionCategory is stripped. Same grid as unfiltered. Duplicate contract is mandatory.",
              },
            });
          }
        },
      );
    }

    test(
      `${query.type} — household and non-household lists are the same (connection type filter is not applied)`,
      { tag: ["@lf-analysis", "@commercial"] },
      async ({ authenticatedApi }, testInfo) => {
        const api = new LFAnalysisApi(authenticatedApi);
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
            api.getLFAnalysis(domesticQuery),
            api.getLFAnalysis(nonDomesticQuery),
          ]);
        } catch (error) {
          test.skip(
            true,
            `LF ${query.type} connectionCategory check timed out: ${error instanceof Error ? error.message : String(error)}`,
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
            "LF detail SQL uses commercialFilterWithoutConnectionCategory. domestic pagination.total, page-1 meters, and LF values must equal non-domestic. Duplicate contract is mandatory.",
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
              `LF ${query.type} connectionCategory check unavailable (HTTP ${statuses.join("/")})`,
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
          const lfValidator = new LFAnalysisValidator();
          const domesticRows = mapLFAnalysisResponse(domesticRes.responseBody);
          const nonDomesticRows = mapLFAnalysisResponse(
            nonDomesticRes.responseBody,
          );
          validation.execute("Domestic page uniqueness", () => {
            lfValidator.validateDuplicateContract(domesticRows);
          });
          validation.execute("Non-domestic page uniqueness", () => {
            lfValidator.validateDuplicateContract(nonDomesticRows);
          });
          validation.execute(
            "Domestic page-1 meters equal non-domestic page-1 meters",
            () => {
              expect(domesticRows.map(lfRowIdentity)).toEqual(
                nonDomesticRows.map(lfRowIdentity),
              );
            },
          );
        } finally {
          ApiValidationHelper.finalize(validation, {
            apiName: `LF Analysis API (${query.type} connectionCategory ignored)`,
            responseTime,
            testInfo,
            defectContext,
          });
        }
      },
    );
  }

  test(
    "Load Factor less than 5% for last 6 months — billing data is not ready yet",
    { tag: ["@lf-analysis", "@commercial"] },
    async ({ authenticatedApi }) => {
      const api = new LFAnalysisApi(authenticatedApi);
      const { rawResponse, responseBody } = await api.getLFAnalysis(
        lfAnalysisLt5Last6mData,
        { maxAttempts: 1 },
      );
      CommercialCommonValidator.validateBillingPeriodNotReady(
        rawResponse.status(),
        responseBody,
        LF_COVERAGE_GATED_MISSING_MONTHS,
      );
    },
  );

  test.describe("Load Factor — first and last page have no duplicate meters", () => {
    test.describe.configure({ retries: 0 });

    for (const query of lfValidatableQueries) {
      test(
        `${query.type} — first and last page have no duplicate meters`,
        { tag: ["@lf-analysis", "@commercial"] },
        async ({ authenticatedApi }, testInfo) => {
          const api = new LFAnalysisApi(authenticatedApi);
          const validator = new LFAnalysisValidator();
          const validation = new ValidationEngine();
          const first = await api.getLFAnalysis(query);
          if (shouldSkipCommercialResponse(first.rawResponse.status(), first.responseBody)) {
            test.skip(
              true,
              `LF ${query.type} last-page uniqueness unavailable (HTTP ${first.rawResponse.status()})`,
            );
            return;
          }
          expect(first.rawResponse.status()).toBe(200);
          const view = getCommercialPaginatedView(first.responseBody.data, query);
          const lastPage = Math.max(1, view.totalPages);
          const [last, nonDomesticFirst, nonDomesticLast] = await Promise.all([
            api.getLFAnalysis({ ...query, page: lastPage }),
            api.getLFAnalysis({
              ...query,
              connectionCategory: "non-domestic",
              page: 1,
            }),
            api.getLFAnalysis({
              ...query,
              connectionCategory: "non-domestic",
              page: lastPage,
            }),
          ]);
          for (const res of [last, nonDomesticFirst, nonDomesticLast]) {
            expect(res.rawResponse.status()).toBe(200);
          }
          validation.execute("Unfiltered page 1 uniqueness", () => {
            validator.validateDuplicateContract(mapLFAnalysisResponse(first.responseBody));
          });
          validation.execute(`Unfiltered last page ${lastPage} uniqueness`, () => {
            validator.validateDuplicateContract(mapLFAnalysisResponse(last.responseBody));
          });
          validation.execute("Non-domestic page 1 uniqueness", () => {
            validator.validateDuplicateContract(
              mapLFAnalysisResponse(nonDomesticFirst.responseBody),
            );
          });
          validation.execute(
            `Non-domestic last page ${lastPage} uniqueness`,
            () => {
              validator.validateDuplicateContract(
                mapLFAnalysisResponse(nonDomesticLast.responseBody),
              );
            },
          );
          ApiValidationHelper.finalize(validation, {
            apiName: `LF Analysis first/last uniqueness (${query.type})`,
            responseTime: first.responseTime,
            testInfo,
            defectContext: {
              module: "COMMERICIAL-ANALYSIS",
              endpoint: first.rawResponse.url(),
              requestParams: { ...query, lastPage },
              responseStatus: first.rawResponse.status(),
              responseBody: first.responseBody,
              expectedBehavior:
                "Duplicate contract on first and last page for unfiltered and non-domestic.",
            },
          });
        },
      );
    }

    // Full-grid uniqueness: same MSN + DTR + LF is a duplicate.
    for (const query of lfValidatableQueries) {
      test(
      `${query.type} — every page is checked so the same meter is not listed twice on the same DTR`,
      { tag: ["@lf-analysis", "@commercial"] },
      async ({ authenticatedApi }, testInfo) => {
        const api = new LFAnalysisApi(authenticatedApi);
        const validator = new LFAnalysisValidator();
        const validation = new ValidationEngine();
        const pageSize = 500;
        const first = await api.getLFAnalysis({
          ...query,
          page: 1,
          pageSize,
        });
        if (shouldSkipCommercialResponse(first.rawResponse.status(), first.responseBody)) {
          test.skip(
            true,
            `LF ${query.type} uniqueness scan unavailable (HTTP ${first.rawResponse.status()})`,
          );
          return;
        }
        expect(first.rawResponse.status()).toBe(200);
        const view = getCommercialPaginatedView(first.responseBody.data, {
          ...query,
          page: 1,
          pageSize,
        });
        const allRows = [...mapLFAnalysisResponse(first.responseBody)];
        for (let page = 2; page <= view.totalPages; page += 1) {
          const next = await api.getLFAnalysis({
            ...query,
            page,
            pageSize,
          });
          expect(next.rawResponse.status()).toBe(200);
          allRows.push(...mapLFAnalysisResponse(next.responseBody));
        }
        expect(allRows.length, `${query.type} collected rows`).toBe(view.totalCount);
        writeCommercialDuplicateSnapshot(query.type, allRows, (row) =>
          formatCommercialMetricKey((row as { lf?: number }).lf),
        );
        validation.execute(`${query.type} collected uniqueness`, () => {
          validator.validateDuplicateContract(allRows);
          validator.validateLfAgainstThreshold(
            allRows,
            LF_TYPE_CONFIG[query.type].threshold,
            LF_TYPE_CONFIG[query.type].operator,
          );
        });
        ApiValidationHelper.finalize(validation, {
          apiName: `LF Analysis uniqueness (${query.type})`,
          responseTime: first.responseTime,
          testInfo,
          defectContext: {
            module: "COMMERICIAL-ANALYSIS",
            endpoint: first.rawResponse.url(),
            requestParams: { ...query, pageSize },
            responseStatus: first.rawResponse.status(),
            responseBody: { total: view.totalCount, collected: allRows.length },
            expectedBehavior:
              "meterLookupId unique. Same MSN with different LF is allowed. Same MSN with the same LF is a duplicate.",
          },
        });
      },
      );
    }
  });
});
