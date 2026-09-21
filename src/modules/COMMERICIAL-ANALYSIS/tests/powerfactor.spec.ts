import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { PowerFactorApi } from "../Api/powerfactor.api";
import {
  pfAnalysisQuery,
  pfCategoryCountBase,
  pfConnectionCategoryCases,
} from "../Data/powerfactor.data";
import { PowerFactorMapper } from "../Mapper/powerfactor.mapper";
import { PowerFactorValidator } from "../Validator/powerfactoranalysis.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { shouldSkipCommercialResponse } from "../utils/commercial-request.helper";
import {
  expectedCommercialPageRecordCount,
  getCommercialPaginatedView,
  logCommercialCategorySplit,
  logCommercialPageCounts,
} from "../Validator/commercial-analysis.shared";

test.describe("Power Factor Violation report", () => {
  test.setTimeout(120000);
  test(
    "Power Factor Violation — report opens, PF is below 0.8, and the same meter is not listed twice on the same DTR",
    { tag: ["@smoke", "@power-factor"] },
    async ({ authenticatedApi }, testInfo) => {
      const api = new PowerFactorApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new PowerFactorValidator();
      const { rawResponse, responseBody, responseTime } = await api.getPfAnalysis(pfAnalysisQuery);

      if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
        test.skip(true, `PF analysis unavailable (HTTP ${rawResponse.status()})`);
        return;
      }
      const defectContext = {
        module: "COMMERICIAL-ANALYSIS",
        endpoint: rawResponse.url(),
        requestParams: pfAnalysisQuery,
        responseStatus: rawResponse.status(),
        responseBody,
        expectedBehavior:
          "Grid { columns, rows, pagination }. PF is the value (0 <= PF < threshold; PF=0 is live on non-domestic). PF<.8 echoes threshold. Same meterLookupId/MSN on two DTRs is allowed. Same MSN+DTR+PF is a duplicate.",
      };

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

        const rows = PowerFactorMapper.mapPfRows(responseBody.data.rows);

        validation.execute("Response Validation", () => validator.validateResponse(responseBody));

        validation.execute("Grid Columns", () => validator.validateGridColumns(responseBody));

        validation.execute("Query Params Validation", () =>
          validator.validateQueryParams(responseBody, pfAnalysisQuery),
        );

        validation.execute("Mandatory Fields Validation", () =>
          validator.validateMandatoryFields(rows),
        );

        validation.execute("PF Below Threshold Validation", () =>
          validator.validatePfBelowThreshold(rows, pfAnalysisQuery.threshold),
        );

        validation.execute("Report Threshold Column Validation", () =>
          validator.validateReportThresholdColumn(rows, pfAnalysisQuery.threshold),
        );

        validation.execute("Duplicate PF Record Validation", () =>
          validator.validateNoDuplicatePfRecords(rows),
        );

        validation.execute("Unique meterLookupId / ivrsNumber / msn", () =>
          validator.validateUniqueIdentityFields(rows),
        );

        validation.execute("Pagination Validation", () =>
          validator.validatePagination(responseBody, pfAnalysisQuery),
        );

        validation.execute("Total Count Validation", () =>
          validator.validateTotalCount(responseBody, pfAnalysisQuery),
        );
      } finally {
        ApiValidationHelper.finalize(validation, {
          apiName: "Power Factor API",
          responseTime,
          testInfo,
          defectContext,
        });
      }
    },
  );

  for (const categoryCase of pfConnectionCategoryCases) {
    test(
      `Power Factor Violation — ${categoryCase.label === "domestic" ? "household" : "non-household"} connections: number of meters on the page matches the total`,
      { tag: ["@power-factor", "@commercial", `@pf-${categoryCase.label}`] },
      async ({ authenticatedApi }, testInfo) => {
        const api = new PowerFactorApi(authenticatedApi);
        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();
        const validator = new PowerFactorValidator();
        const query = categoryCase.query;
        const { rawResponse, responseBody, responseTime } = await api.getPfAnalysis(query);

        if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
          test.skip(true, `PF ${categoryCase.label} unavailable (HTTP ${rawResponse.status()})`);
          return;
        }

        const defectContext = {
          module: "COMMERICIAL-ANALYSIS",
          endpoint: rawResponse.url(),
          requestParams: query,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: `PF connectionCategory=${categoryCase.connectionCategory}: rows.length must equal f(pagination.total, page, limit).`,
        };

        try {
          validation.execute("Status Code Validation", () =>
            assert.validateStatusCode(rawResponse, 200),
          );

          if (rawResponse.status() !== 200) {
            return;
          }

          const rows = PowerFactorMapper.mapPfRows(responseBody.data.rows);
          const view = getCommercialPaginatedView(responseBody.data, query);
          const expectedRecords = expectedCommercialPageRecordCount(
            view.totalCount,
            view.page,
            view.pageSize,
          );
          logCommercialPageCounts({
            label: `PF ${categoryCase.label}`,
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

          validation.execute("Pagination Validation", () =>
            validator.validatePagination(responseBody, query),
          );

          validation.execute("Total Count Validation (records vs total)", () =>
            validator.validateTotalCount(responseBody, query),
          );

          validation.execute("PF Below Threshold", () =>
            validator.validatePfBelowThreshold(rows, query.threshold),
          );

          validation.execute("PF<.8 threshold echo", () =>
            validator.validateReportThresholdColumn(rows, query.threshold),
          );

          validation.execute("Unique meterLookupId / ivrsNumber / msn", () =>
            validator.validateUniqueIdentityFields(rows),
          );

          validation.execute("No duplicate meters on page", () =>
            validator.validateNoDuplicatePfRecords(rows),
          );
        } finally {
          ApiValidationHelper.finalize(validation, {
            apiName: `Power Factor API (${categoryCase.label})`,
            responseTime,
            testInfo,
            defectContext,
          });
        }
      },
    );
  }

  test(
    "Power Factor Violation — household plus non-household meters add up to the full total",
    { tag: ["@power-factor", "@commercial", "@pf-category-split"] },
    async ({ authenticatedApi }, testInfo) => {
      const api = new PowerFactorApi(authenticatedApi);
      const validation = new ApiValidationHelper();
      const validator = new PowerFactorValidator();

      const unfilteredQuery = { ...pfCategoryCountBase };
      const [allRes, domesticRes, nonDomesticRes] = await Promise.all([
        api.getPfAnalysis(unfilteredQuery),
        api.getPfAnalysis(pfConnectionCategoryCases[0]!.query),
        api.getPfAnalysis(pfConnectionCategoryCases[1]!.query),
      ]);

      const responseTime = Math.max(
        allRes.responseTime,
        domesticRes.responseTime,
        nonDomesticRes.responseTime,
      );

      const defectContext = {
        module: "COMMERICIAL-ANALYSIS",
        endpoint: allRes.rawResponse.url(),
        requestParams: {
          unfiltered: unfilteredQuery,
          domestic: pfConnectionCategoryCases[0]!.query,
          nonDomestic: pfConnectionCategoryCases[1]!.query,
        },
        responseStatus: allRes.rawResponse.status(),
        responseBody: {
          all: allRes.responseBody,
          domestic: domesticRes.responseBody,
          nonDomestic: nonDomesticRes.responseBody,
        },
        expectedBehavior:
          "domestic.total + non-domestic.total <= unfiltered.total; each category has page records matching its total.",
      };

      try {
        if (
          shouldSkipCommercialResponse(allRes.rawResponse.status(), allRes.responseBody) ||
          shouldSkipCommercialResponse(
            domesticRes.rawResponse.status(),
            domesticRes.responseBody,
          ) ||
          shouldSkipCommercialResponse(
            nonDomesticRes.rawResponse.status(),
            nonDomesticRes.responseBody,
          )
        ) {
          test.skip(true, "PF category split unavailable after retries");
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

        const allView = getCommercialPaginatedView(allRes.responseBody.data, unfilteredQuery);
        const domesticView = getCommercialPaginatedView(
          domesticRes.responseBody.data,
          pfConnectionCategoryCases[0]!.query,
        );
        const nonDomesticView = getCommercialPaginatedView(
          nonDomesticRes.responseBody.data,
          pfConnectionCategoryCases[1]!.query,
        );

        logCommercialPageCounts({
          label: "PF unfiltered",
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
          label: "PF domestic",
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
          label: "PF non-domestic",
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

        validation.execute("Unfiltered pagination counts", () =>
          validator.validateTotalCount(allRes.responseBody, unfilteredQuery),
        );
        validation.execute("Domestic pagination counts", () =>
          validator.validateTotalCount(
            domesticRes.responseBody,
            pfConnectionCategoryCases[0]!.query,
          ),
        );
        validation.execute("Non-domestic pagination counts", () =>
          validator.validateTotalCount(
            nonDomesticRes.responseBody,
            pfConnectionCategoryCases[1]!.query,
          ),
        );

        validation.execute("Domestic + non-domestic ≤ unfiltered total", () =>
          validator.validateDomesticNonDomesticTotals({
            allTotal: allView.totalCount,
            domesticTotal: domesticView.totalCount,
            nonDomesticTotal: nonDomesticView.totalCount,
          }),
        );
      } finally {
        ApiValidationHelper.finalize(validation, {
          apiName: "Power Factor API (category split)",
          responseTime,
          testInfo,
          defectContext,
        });
      }
    },
  );
});
