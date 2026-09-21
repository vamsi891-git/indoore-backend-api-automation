import type { TestInfo } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { LossAnalysisApi } from "../Api/loss-analysis.api";
import { buildLossAnalysisQuery } from "../Data/loss-analysis.data";
import {
  getLossAnalysisPaginatedView,
  LossNetworkType,
  LossReportType,
} from "../Mapper/loss-analysis.mapper";
import { LossAnalysisValidator } from "../Validator/loss-analysis.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { BackendResponse } from "../../../core/utils/backend-response.util";

export function registerLossAnalysisTests(
  networkType: LossNetworkType,
  getNetworkLookupId: () => number,
  reportTypes: LossReportType[],
): void {
  for (const reportType of reportTypes) {
    test(
      `Validate ${reportType.toUpperCase()} loss analysis`,
      {
        tag: ["@smoke", "@energy-audit", "@loss-analysis", `@${networkType}`, `@${reportType}`],
      },
      async ({ authenticatedApi }, testInfo: TestInfo) => {
        const query = buildLossAnalysisQuery(reportType, networkType, getNetworkLookupId());
        const api = new LossAnalysisApi(authenticatedApi);
        const { rawResponse, responseBody, responseTime } = await api.getLossAnalysis(query);

        if (rawResponse.status() >= 500) {
          BackendResponse.logFinding(
            `Loss analysis ${networkType}/${reportType}`,
            rawResponse.status(),
            responseBody,
          );
        }

        const assert = new ApiValidationHelper();
        const validation = new ApiValidationHelper();
        const validator = new LossAnalysisValidator();
        const defectContext = {
          module: "ENERGY-AUDITS",
          endpoint: rawResponse.url(),
          requestParams: query,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "Grid loss analysis: inputUnits, totalSoldUnits, lossKwh, billingEfficiencyPct, lossPct with pagination.",
        };

        if (rawResponse.status() !== 200 || responseBody.success !== true) {
          try {
            ApiValidationHelper.runStandardChecks(validation, assert, {
              apiName: `Energy Audit Loss Analysis (${networkType}/${reportType})`,
              rawResponse,
              responseBody,
              responseTime,
              maxResponseTimeMs: 120000,
            });
          } finally {
            ApiValidationHelper.finalize(validation, {
              apiName: `Energy Audit Loss Analysis (${networkType}/${reportType})`,
              responseTime,
              testInfo,
              defectContext,
            });
          }
          return;
        }

        const view = getLossAnalysisPaginatedView(responseBody, query);

        try {
          ApiValidationHelper.runStandardChecks(validation, assert, {
            apiName: `Energy Audit Loss Analysis (${networkType}/${reportType})`,
            rawResponse,
            responseBody,
            responseTime,
            maxResponseTimeMs: 120000,
          });

          validation.execute("Response Contract", () => validator.validateResponse(responseBody));
          validation.execute("Columns Contract", () => validator.validateColumns(view, reportType));
          validation.execute("Pagination", () => validator.validatePagination(view, query));
          validation.execute("Total Count", () => validator.validateTotalCount(view));
          validation.execute("Page Row Count", () => validator.validatePageRowCount(view));
          validation.execute("Rows Exist", () => validator.validateRowsExist(view));
          validation.execute("SL No Sequence", () =>
            validator.validateSlNoSequence(view.rows, query),
          );
          validation.execute("Mandatory Fields", () =>
            validator.validateMandatoryFields(view.rows, networkType),
          );
          validation.execute("Field Types", () =>
            validator.validateFieldTypes(view.rows, networkType),
          );
          validation.execute("Non-Negative Metrics", () =>
            validator.validateNonNegativeMetrics(view.rows, networkType),
          );
          validation.execute("Row ID Format", () => validator.validateRowIds(view.rows));
          if (networkType === "feeder") {
            validation.execute("Feeder Meter Serial Format", () =>
              validator.validateFeederMeterSerialFormat(view.rows),
            );
            validation.execute("Feeder Scope Consistency", () =>
              validator.validateFeederScopeConsistency(view.rows),
            );
          }
          validation.execute("Duplicate IDs", () =>
            validator.validateNoDuplicateIds(view.rows, networkType),
          );
          validation.execute("Duplicate Meter Serials", () =>
            validator.validateNoDuplicateMeterSerials(view.rows, networkType),
          );
          validation.execute("Duplicate DTR Codes", () =>
            validator.validateNoDuplicateDtrCodes(view.rows, reportType),
          );
          validation.execute("Duplicate DTR Names", () =>
            validator.validateNoDuplicateDtrNames(view.rows, networkType),
          );
          validation.execute("Loss Calculations", () =>
            validator.validateLossCalculations(view.rows),
          );
          validation.execute("Cross Field Logic", () => validator.validateCrossFieldLogic(view));
        } finally {
          ApiValidationHelper.finalize(validation, {
            apiName: `Energy Audit Loss Analysis (${networkType}/${reportType})`,
            responseTime,
            testInfo,
            defectContext,
          });
        }
      },
    );
  }
}
