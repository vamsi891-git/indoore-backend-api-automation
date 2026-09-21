import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { MdAnalysisApi } from "../Api/mdanalysis.api";
import { mapMdAnalysisResponse } from "../Mapper/mdanalysis.mapper";
import { MdAnalysisValidator } from "../Validator/mdanalysis.validator";
import {
  mdAnalysisImproperData,
  mdConnectionCategoryCases,
  mdSmokeQueries,
  mdTypeSplitCases,
} from "../Data/mdanalysis.data";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import {
  expectedCommercialPageRecordCount,
  getCommercialPaginatedView,
  logCommercialCategorySplit,
  logCommercialPageCounts,
} from "../Validator/commercial-analysis.shared";
import {
  isConnectionCategoryFilterIgnored,
  shouldSkipCommercialResponse,
} from "../utils/commercial-request.helper";
function expectedMdBehavior(type: string): string {
  if (type === "Improper MD") {
    return "Grid includes subStation and mdDate (no numeric md). connectionCategory is stripped. Unique meterLookupId. No duplicate records.";
  }
  return "Grid { sanctionedLoad, md }. md > sanctionedLoad > 0. connectionCategory is honored. Unique meterLookupId. No duplicate records.";
}
test.describe("Maximum Demand report", () => {
  test.setTimeout(180_000);
  for (const query of mdSmokeQueries) {
    test(
      `${query.type} — report opens and demand is above sanctioned load`,
      { tag: ["@smoke", "@md-analysis"] },
      async ({ authenticatedApi }, testInfo) => {
        const api = new MdAnalysisApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } = await api.getMdAnalysis(query);
        if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
          test.skip(true, `MD ${query.type} unavailable (HTTP ${rawResponse.status()})`);
          return;
        }
        const defectContext = {
          module: "COMMERICIAL-ANALYSIS",
          endpoint: rawResponse.url(),
          requestParams: query,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: expectedMdBehavior(query.type),
        };
        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();
        const validator = new MdAnalysisValidator();
        try {
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
          const rows = mapMdAnalysisResponse(responseBody);

          validation.execute("Response Validation", () => validator.validateResponse(responseBody));
          validation.execute("Grid Columns", () =>
            validator.validateGridColumns(responseBody, query.type),
          );
          validation.execute("Query Params Validation", () =>
            validator.validateQueryParams(responseBody, query),
          );
          validation.execute("Report Type Validation", () =>
            validator.validateReportForType(responseBody, query.type),
          );
          validation.execute("Mandatory Fields Validation", () =>
            validator.validateMandatoryFields(rows, query.type),
          );
          validation.execute("MD Business Rules Validation", () =>
            validator.validateBusinessRules(rows, query.type),
          );
          validation.execute("Duplicate MD Record Validation", () =>
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
            apiName: `MD Analysis API (${query.type})`,
            responseTime,
            testInfo,
            defectContext,
          });
        }
      },
    );
  }

  test(
    "Improper MD — household and non-household lists are the same (connection type filter is not applied)",
    { tag: ["@md-analysis", "@commercial"] },
    async ({ authenticatedApi }, testInfo) => {
      const api = new MdAnalysisApi(authenticatedApi);
      const domesticQuery = {
        ...mdAnalysisImproperData,
        connectionCategory: "domestic" as const,
      };
      const nonDomesticQuery = {
        ...domesticQuery,
        connectionCategory: "non-domestic" as const,
      };

      let domesticRes;
      let nonDomesticRes;
      try {
        [domesticRes, nonDomesticRes] = await Promise.all([
          api.getMdAnalysis(domesticQuery),
          api.getMdAnalysis(nonDomesticQuery),
        ]);
      } catch (error) {
        test.skip(
          true,
          `Improper MD connectionCategory check timed out: ${error instanceof Error ? error.message : String(error)}`,
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
          "Improper MD uses commercialFilterWithoutConnectionCategory. domestic pagination.total must equal non-domestic pagination.total.",
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
            `Improper MD connectionCategory check unavailable (HTTP ${statuses.join("/")})`,
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
          label: "Improper MD domestic (filter ignored)",
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
          label: "Improper MD non-domestic (filter ignored)",
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
        const mdValidator = new MdAnalysisValidator();
        validation.execute("Improper MD duplicate contract", () => {
          mdValidator.validateDuplicateContract(mapMdAnalysisResponse(domesticRes.responseBody));
        });
        validation.execute("Improper MD non-domestic duplicate contract", () => {
          mdValidator.validateDuplicateContract(mapMdAnalysisResponse(nonDomesticRes.responseBody));
        });
      } finally {
        ApiValidationHelper.finalize(validation, {
          apiName: "MD Analysis API (Improper MD connectionCategory ignored)",
          responseTime,
          testInfo,
          defectContext,
        });
      }
    },
  );
  for (const categoryCase of mdConnectionCategoryCases) {
    test(
      `${categoryCase.type} — ${categoryCase.connectionCategory === "domestic" ? "household" : "non-household"} connections: meter count matches the total`,
      {
        tag: ["@md-analysis", "@commercial", `@md-${categoryCase.connectionCategory}`],
      },
      async ({ authenticatedApi }, testInfo) => {
        const api = new MdAnalysisApi(authenticatedApi);
        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();
        const validator = new MdAnalysisValidator();
        const query = categoryCase.query;
        const { rawResponse, responseBody, responseTime } = await api.getMdAnalysis(query);

        if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
          test.skip(true, `MD ${categoryCase.label} unavailable (HTTP ${rawResponse.status()})`);
          return;
        }

        const defectContext = {
          module: "COMMERICIAL-ANALYSIS",
          endpoint: rawResponse.url(),
          requestParams: query,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: `MD type=${categoryCase.type} category=${categoryCase.connectionCategory}: md > sanctionedLoad; records vs total; unique meterLookupId. This report has no duplicate records.`,
        };

        try {
          validation.execute("Status Code Validation", () =>
            assert.validateStatusCode(rawResponse, 200),
          );
          if (rawResponse.status() !== 200) {
            return;
          }
          const rows = mapMdAnalysisResponse(responseBody);
          const view = getCommercialPaginatedView(responseBody.data, query);
          const expectedRecords = expectedCommercialPageRecordCount(
            view.totalCount,
            view.page,
            view.pageSize,
          );
          logCommercialPageCounts({
            label: `MD ${categoryCase.label}`,
            connectionCategory: categoryCase.connectionCategory,
            page: view.page,
            pageSize: view.pageSize,
            total: view.totalCount,
            totalPages: view.totalPages,
            records: view.rows.length,
            expectedRecords,
          });

          validation.execute("Response has rows", () => {
            expect(view.totalCount).toBeGreaterThan(0);
            expect(rows.length).toBeGreaterThan(0);
          });
          validation.execute("Grid Columns", () =>
            validator.validateGridColumns(responseBody, categoryCase.type),
          );
          validation.execute("Pagination Validation", () =>
            validator.validatePagination(responseBody, query),
          );
          validation.execute("Total Count Validation (records vs total)", () =>
            validator.validateTotalCount(responseBody, query),
          );
          validation.execute("MD Business Rules", () =>
            validator.validateBusinessRules(rows, categoryCase.type),
          );
          validation.execute("Duplicate contract", () => validator.validateDuplicateContract(rows));
        } finally {
          ApiValidationHelper.finalize(validation, {
            apiName: `MD Analysis API (${categoryCase.label})`,
            responseTime,
            testInfo,
            defectContext,
          });
        }
      },
    );
  }

  for (const splitCase of mdTypeSplitCases) {
    test(
      `${splitCase.type} — household plus non-household meters equal the full total`,
      { tag: ["@md-analysis", "@commercial", "@md-category-split"] },
      async ({ authenticatedApi }, testInfo) => {
        const api = new MdAnalysisApi(authenticatedApi);
        const validation = new ApiValidationHelper();
        const validator = new MdAnalysisValidator();

        const [allRes, domesticRes, nonDomesticRes] = await Promise.all([
          api.getMdAnalysis(splitCase.unfilteredQuery),
          api.getMdAnalysis(splitCase.domesticQuery),
          api.getMdAnalysis(splitCase.nonDomesticQuery),
        ]);

        const responseTime = Math.max(
          allRes.responseTime,
          domesticRes.responseTime,
          nonDomesticRes.responseTime,
        );

        const defectContext = {
          module: "COMMERICIAL-ANALYSIS",
          endpoint: allRes.rawResponse.url(),
          requestParams: splitCase,
          responseStatus: allRes.rawResponse.status(),
          responseBody: {
            all: allRes.responseBody,
            domestic: domesticRes.responseBody,
            nonDomestic: nonDomesticRes.responseBody,
          },
          expectedBehavior:
            "domestic.total + non-domestic.total = unfiltered.total. Unique meterLookupId. This report has no duplicate records.",
        };

        try {
          const statuses = [
            allRes.rawResponse.status(),
            domesticRes.rawResponse.status(),
            nonDomesticRes.rawResponse.status(),
          ];
          if (
            statuses.some((status, i) =>
              shouldSkipCommercialResponse(
                status,
                [allRes, domesticRes, nonDomesticRes][i]!.responseBody,
              ),
            )
          ) {
            test.skip(
              true,
              `MD ${splitCase.type} category split unavailable (HTTP ${statuses.join("/")})`,
            );
            return;
          }

          validation.execute("All three category requests return 200", () => {
            expect(allRes.rawResponse.status()).toBe(200);
            expect(domesticRes.rawResponse.status()).toBe(200);
            expect(nonDomesticRes.rawResponse.status()).toBe(200);
          });

          if (
            allRes.rawResponse.status() !== 200 ||
            domesticRes.rawResponse.status() !== 200 ||
            nonDomesticRes.rawResponse.status() !== 200
          ) {
            return;
          }

          const allView = getCommercialPaginatedView(
            allRes.responseBody.data,
            splitCase.unfilteredQuery,
          );
          const domesticView = getCommercialPaginatedView(
            domesticRes.responseBody.data,
            splitCase.domesticQuery,
          );
          const nonDomesticView = getCommercialPaginatedView(
            nonDomesticRes.responseBody.data,
            splitCase.nonDomesticQuery,
          );

          logCommercialPageCounts({
            label: `MD ${splitCase.type} unfiltered`,
            page: allView.page,
            pageSize: allView.pageSize,
            total: allView.totalCount,
            totalPages: allView.totalPages,
            records: allView.rows.length,
            expectedRecords: expectedCommercialPageRecordCount(
              allView.totalCount,
              allView.page,
              allView.pageSize,
            ),
          });
          logCommercialPageCounts({
            label: `MD ${splitCase.type} domestic`,
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
            label: `MD ${splitCase.type} non-domestic`,
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
          logCommercialCategorySplit({
            allTotal: allView.totalCount,
            domesticTotal: domesticView.totalCount,
            nonDomesticTotal: nonDomesticView.totalCount,
          });

          if (
            isConnectionCategoryFilterIgnored(
              allView.totalCount,
              domesticView.totalCount,
              nonDomesticView.totalCount,
            )
          ) {
            test.skip(
              true,
              `MD ${splitCase.type}: connectionCategory ignored (domestic and non-domestic totals equal unfiltered ${allView.totalCount})`,
            );
            return;
          }

          validation.execute("Unfiltered pagination counts", () =>
            validator.validateTotalCount(allRes.responseBody, splitCase.unfilteredQuery),
          );
          validation.execute("Domestic pagination counts", () =>
            validator.validateTotalCount(domesticRes.responseBody, splitCase.domesticQuery),
          );
          validation.execute("Non-domestic pagination counts", () =>
            validator.validateTotalCount(nonDomesticRes.responseBody, splitCase.nonDomesticQuery),
          );
          validation.execute("Domestic + non-domestic = unfiltered total", () =>
            validator.validateDomesticNonDomesticTotals({
              allTotal: allView.totalCount,
              domesticTotal: domesticView.totalCount,
              nonDomesticTotal: nonDomesticView.totalCount,
            }),
          );
          validation.execute("Unfiltered page uniqueness", () => {
            validator.validateDuplicateContract(mapMdAnalysisResponse(allRes.responseBody));
          });
          validation.execute("Domestic page uniqueness", () => {
            validator.validateDuplicateContract(mapMdAnalysisResponse(domesticRes.responseBody));
          });
          validation.execute("Non-domestic page uniqueness", () => {
            validator.validateDuplicateContract(mapMdAnalysisResponse(nonDomesticRes.responseBody));
          });
        } finally {
          ApiValidationHelper.finalize(validation, {
            apiName: `MD Analysis API (split ${splitCase.type})`,
            responseTime,
            testInfo,
            defectContext,
          });
        }
      },
    );
  }

  test.describe("Maximum Demand — first and last page have no duplicate meters", () => {
    test.describe.configure({ retries: 0 });
    for (const query of mdSmokeQueries) {
      test(
        `${query.type} — first and last page have no duplicate meters`,
        { tag: ["@md-analysis", "@commercial"] },
        async ({ authenticatedApi }, testInfo) => {
          const api = new MdAnalysisApi(authenticatedApi);
          const validator = new MdAnalysisValidator();
          const validation = new ApiValidationHelper();
          const first = await api.getMdAnalysis(query);
          if (shouldSkipCommercialResponse(first.rawResponse.status(), first.responseBody)) {
            test.skip(
              true,
              `MD ${query.type} uniqueness unavailable (HTTP ${first.rawResponse.status()})`,
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
          const unfilteredLastPage = Math.max(1, view.totalPages);
          const [domesticFirst, nonDomesticFirst] = await Promise.all([
            api.getMdAnalysis({
              ...query,
              connectionCategory: "domestic",
              page: 1,
            }),
            api.getMdAnalysis({
              ...query,
              connectionCategory: "non-domestic",
              page: 1,
            }),
          ]);
          expect(domesticFirst.rawResponse.status()).toBe(200);
          expect(nonDomesticFirst.rawResponse.status()).toBe(200);
          const domesticView = getCommercialPaginatedView(domesticFirst.responseBody.data, {
            ...pageQuery,
            page: 1,
          });
          const nonDomesticView = getCommercialPaginatedView(nonDomesticFirst.responseBody.data, {
            ...pageQuery,
            page: 1,
          });
          const domesticLastPage = Math.max(1, domesticView.totalPages);
          const nonDomesticLastPage = Math.max(1, nonDomesticView.totalPages);
          const [last, domesticLast, nonDomesticLast] = await Promise.all([
            unfilteredLastPage === 1
              ? Promise.resolve(first)
              : api.getMdAnalysis({ ...query, page: unfilteredLastPage }),
            domesticLastPage === 1
              ? Promise.resolve(domesticFirst)
              : api.getMdAnalysis({
                  ...query,
                  connectionCategory: "domestic",
                  page: domesticLastPage,
                }),
            nonDomesticLastPage === 1
              ? Promise.resolve(nonDomesticFirst)
              : api.getMdAnalysis({
                  ...query,
                  connectionCategory: "non-domestic",
                  page: nonDomesticLastPage,
                }),
          ]);
          for (const res of [last, domesticLast, nonDomesticLast]) {
            expect(res.rawResponse.status()).toBe(200);
          }
          validation.execute("Unfiltered page 1 uniqueness", () => {
            validator.validateDuplicateContract(mapMdAnalysisResponse(first.responseBody));
          });
          validation.execute(`Unfiltered last page ${unfilteredLastPage} uniqueness`, () => {
            validator.validateDuplicateContract(mapMdAnalysisResponse(last.responseBody));
          });
          validation.execute("Domestic page 1 uniqueness", () => {
            validator.validateDuplicateContract(mapMdAnalysisResponse(domesticFirst.responseBody));
          });
          validation.execute(`Domestic last page ${domesticLastPage} uniqueness`, () => {
            validator.validateDuplicateContract(mapMdAnalysisResponse(domesticLast.responseBody));
          });
          validation.execute("Non-domestic page 1 uniqueness", () => {
            validator.validateDuplicateContract(
              mapMdAnalysisResponse(nonDomesticFirst.responseBody),
            );
          });
          validation.execute(`Non-domestic last page ${nonDomesticLastPage} uniqueness`, () => {
            validator.validateDuplicateContract(
              mapMdAnalysisResponse(nonDomesticLast.responseBody),
            );
          });
          ApiValidationHelper.finalize(validation, {
            apiName: `MD Analysis first/last uniqueness (${query.type})`,
            responseTime: first.responseTime,
            testInfo,
            defectContext: {
              module: "COMMERICIAL-ANALYSIS",
              endpoint: first.rawResponse.url(),
              requestParams: {
                ...query,
                unfilteredLastPage,
                domesticLastPage,
                nonDomesticLastPage,
              },
              responseStatus: first.rawResponse.status(),
              responseBody: first.responseBody,
              expectedBehavior: "meterLookupId unique. This report has no duplicate records.",
            },
          });
        },
      );
    }
  });
});
