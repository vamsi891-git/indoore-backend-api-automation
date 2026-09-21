import type { TestInfo } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { NetworkTrendsApi } from "../Api/network-trends.api";
import { NetworkTrendQuery } from "../Mapper/network-trends.mapper";
import { mapNetworkTrendData } from "../Mapper/network-trends.mapper";
import { NetworkTrendsValidator } from "../Validator/network-trends.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

export function registerNetworkTrendsTest(
  label: string,
  buildQuery: () => NetworkTrendQuery,
): void {
  test(
    `Validate ${label} network trends`,
    {
      tag: ["@smoke", "@energy-audit", "@network-trends", `@${label}`],
    },
    async ({ authenticatedApi }, testInfo: TestInfo) => {
      const query = buildQuery();
      const api = new NetworkTrendsApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getNetworkTrends(query);

      const defectContext = {
        module: "ENERGY-AUDITS",
        endpoint: rawResponse.url(),
        requestParams: query,
        responseStatus: rawResponse.status(),
        responseBody,
        expectedBehavior:
          "billing: 12 monthly periods (anchorMonth/anchorYear, item date null); dp: 12 daily periods (anchorDate, item month/year null); ls: 24 hourly buckets H1..H24 on anchorDate.",
      };

      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new NetworkTrendsValidator();

      if (rawResponse.status() !== 200 || responseBody.success !== true) {
        try {
          ApiValidationHelper.runStandardChecks(validation, assert, {
            apiName: `Energy Audit Network Trends (${label})`,
            rawResponse,
            responseBody,
            responseTime,
            maxResponseTimeMs: 180000,
          });
        } finally {
          ApiValidationHelper.finalize(validation, {
            apiName: `Energy Audit Network Trends (${label})`,
            responseTime,
            testInfo,
            defectContext,
          });
        }
        return;
      }

      const data = mapNetworkTrendData(responseBody);
      try {
        ApiValidationHelper.runStandardChecks(validation, assert, {
          apiName: `Energy Audit Network Trends (${label})`,
          rawResponse,
          responseBody,
          responseTime,
          maxResponseTimeMs: 180000,
        });

        validation.execute("Response Contract", () => validator.validateResponse(responseBody));
        validation.execute("Report Type Echo", () => validator.validateReportTypeEcho(data, query));
        validation.execute("Anchor Null Rules", () =>
          validator.validateAnchorFields(data, query["report-type"]),
        );
        validation.execute("Item Count", () => validator.validateItemCount(data));
        validation.execute("Item Null Rules", () => validator.validateItemNullRules(data));
        validation.execute("Period Labels", () => validator.validatePeriodLabels(data));
        validation.execute("Loss Percentage Range", () => validator.validateLossPct(data.items));
        validation.execute("No Duplicate Periods", () =>
          validator.validateNoDuplicatePeriods(data),
        );
        validation.execute("Chronological Sequence", () =>
          validator.validateChronologicalOrder(data),
        );
        validation.execute("Cross Field Logic", () =>
          validator.validateCrossFieldLogic(data, query),
        );
      } finally {
        ApiValidationHelper.finalize(validation, {
          apiName: `Energy Audit Network Trends (${label})`,
          responseTime,
          testInfo,
          defectContext,
        });
      }
    },
  );
}
