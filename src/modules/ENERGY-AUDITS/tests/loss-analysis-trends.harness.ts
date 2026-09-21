import type { TestInfo } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { LossAnalysisTrendsApi } from "../Api/loss-analysis-trends.api";
import { LossAnalysisTrendsQuery } from "../Mapper/loss-analysis-trends.mapper";
import { mapLossAnalysisTrendsData } from "../Mapper/loss-analysis-trends.mapper";
import { LossAnalysisTrendsValidator } from "../Validator/loss-analysis-trends.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

export function registerLossAnalysisTrendsTest(
  label: string,
  buildQuery: () => LossAnalysisTrendsQuery,
): void {
  test(
    `Validate ${label} loss analysis trends`,
    {
      tag: ["@smoke", "@energy-audit", "@loss-analysis-trends", `@${label}`],
    },
    async ({ authenticatedApi }, testInfo: TestInfo) => {
      const query = buildQuery();
      const api = new LossAnalysisTrendsApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getLossAnalysisTrends(query);
      const defectContext = {
        module: "ENERGY-AUDITS",
        endpoint: rawResponse.url(),
        requestParams: query,
        responseStatus: rawResponse.status(),
        responseBody,
        expectedBehavior:
          "DTR-scoped hourly loss trend for anchor date: networkLookupId echoes query; date is ISO YYYY-MM-DD; 24 items H1..H24 with matching HH:00 time and lossPct 0..100.",
      };

      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new LossAnalysisTrendsValidator();

      if (rawResponse.status() !== 200 || responseBody.success !== true) {
        try {
          ApiValidationHelper.runStandardChecks(validation, assert, {
            apiName: `Energy Audit Loss Analysis Trends (${label})`,
            rawResponse,
            responseBody,
            responseTime,
            maxResponseTimeMs: 180000,
          });
        } finally {
          ApiValidationHelper.finalize(validation, {
            apiName: `Energy Audit Loss Analysis Trends (${label})`,
            responseTime,
            testInfo,
            defectContext,
          });
        }
        return;
      }

      const data = mapLossAnalysisTrendsData(responseBody);
      try {
        ApiValidationHelper.runStandardChecks(validation, assert, {
          apiName: `Energy Audit Loss Analysis Trends (${label})`,
          rawResponse,
          responseBody,
          responseTime,
          maxResponseTimeMs: 180000,
        });

        validation.execute("Response Contract", () => validator.validateResponse(responseBody));
        validation.execute("Query Echo", () => validator.validateQueryEcho(data, query));
        validation.execute("Root Fields", () => validator.validateRootFields(data));
        validation.execute("Item Count", () => validator.validateItemCount(data.items));
        validation.execute("Item Shape", () => validator.validateItemShape(data.items));
        validation.execute("Loss Percentage Range", () => validator.validateLossPct(data.items));
        validation.execute("No Duplicate Hours", () =>
          validator.validateNoDuplicateHours(data.items),
        );
        validation.execute("Hour Sequence", () => validator.validateHourSequence(data.items));
        validation.execute("Cross Field Logic", () =>
          validator.validateCrossFieldLogic(data, query),
        );
      } finally {
        ApiValidationHelper.finalize(validation, {
          apiName: `Energy Audit Loss Analysis Trends (${label})`,
          responseTime,
          testInfo,
          defectContext,
        });
      }
    },
  );
}
