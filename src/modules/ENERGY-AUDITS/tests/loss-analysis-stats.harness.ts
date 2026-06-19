import type { TestInfo } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { LossAnalysisStatsApi } from "../Api/loss-analysis-stats.api";
import { LossAnalysisStatsQuery } from "../Mapper/loss-analysis-stats.mapper";
import { mapLossAnalysisStatsData } from "../Mapper/loss-analysis-stats.mapper";
import { LossAnalysisStatsValidator } from "../Validator/loss-analysis-stats.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

export function registerLossAnalysisStatsTest(
  label: string,
  buildQuery: () => LossAnalysisStatsQuery,
): void {
  test(
    `Validate ${label} loss analysis stats`,
    {
      tag: ["@smoke", "@energy-audit", "@loss-analysis-stats", `@${label}`],
    },
    async ({ authenticatedApi }, testInfo: TestInfo) => {
      const query = buildQuery();
      const api = new LossAnalysisStatsApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getLossAnalysisStats(query);
      const data = mapLossAnalysisStatsData(responseBody);

      const defectContext = {
        module: "ENERGY-AUDITS",
        endpoint: "/indore/energy-audit/loss-analysis-stats",
        requestParams: query,
        responseStatus: rawResponse.status(),
        responseBody,
        expectedBehavior:
          "DTR-scoped date-range stats: totals echo query; totalLoss=max(0,input-consumption); peakLossHour/lowestLossHour are H1..H24 buckets with matching HH:00 time and lossPct 0..100.",
      };

      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new LossAnalysisStatsValidator();

      try {
        ApiValidationHelper.runStandardChecks(validation, assert, {
          apiName: `Energy Audit Loss Analysis Stats (${label})`,
          rawResponse,
          responseBody,
          responseTime,
          maxResponseTimeMs: 180000,
        });

        validation.execute("Response Contract", () =>
          validator.validateResponse(responseBody),
        );
        validation.execute("Query Echo", () =>
          validator.validateQueryEcho(data, query),
        );
        validation.execute("Date Fields", () =>
          validator.validateDateFields(data),
        );
        validation.execute("Energy Metric Types", () =>
          validator.validateEnergyMetricTypes(data),
        );
        validation.execute("Non-Negative Totals", () =>
          validator.validateNonNegativeTotals(data),
        );
        validation.execute("Total Loss Math", () =>
          validator.validateTotalLossMath(data),
        );
        validation.execute("Loss Not Exceeding Input", () =>
          validator.validateLossNotExceedingInput(data),
        );
        validation.execute("Peak Loss Hour", () =>
          validator.validatePeakLossHour(data),
        );
        validation.execute("Lowest Loss Hour", () =>
          validator.validateLowestLossHour(data),
        );
        validation.execute("Peak Vs Lowest Loss", () =>
          validator.validatePeakVsLowest(data),
        );
        validation.execute("Zero Data Consistency", () =>
          validator.validateZeroDataConsistency(data),
        );
        validation.execute("Cross Field Logic", () =>
          validator.validateCrossFieldLogic(data, query),
        );
      } finally {
        ApiValidationHelper.finalize(validation, {
          apiName: `Energy Audit Loss Analysis Stats (${label})`,
          responseTime,
          testInfo,
          defectContext,
        });
      }
    },
  );
}
