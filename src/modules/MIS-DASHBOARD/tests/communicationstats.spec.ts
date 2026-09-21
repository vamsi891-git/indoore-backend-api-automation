import { test } from "../../../fixtures/api.fixture";
import { CommStatsApi } from "../Api/communicationstats.api";
import { CommStatsMapper } from "../Mapper/communicationstats.mapper";
import { CommStatsValidator } from "../Validator/communicationstats.validator";
import { commStatsQuery, commStatsTestCases } from "../Data/communicationstats.data";
import { MisDashboardEdgesValidator } from "../Validator/mis-dashboard.edges.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("How many meters we have", () => {
  for (const testCase of commStatsTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new CommStatsApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getCommStats(testCase.params);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommStatsValidator();
      const edges = new MisDashboardEdgesValidator();

      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, testCase.expectedStatus, responseBody),
      );
      validation.execute("Content", () =>
        assert.validateContentType(rawResponse, "application/json"),
      );
      validation.execute("Performance", () => assert.validateResponseTime(responseTime, 120000));
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));

      if (testCase.expectedStatus !== 200) {
        validation.execute("Error code", () => edges.validateValidationError(responseBody));
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      const data = CommStatsMapper.mapCommStats(responseBody.data);
      validation.execute("Response", () => validator.validateResponse(responseBody));
      validation.execute("Live date is today", () => validator.validateDates(data));
      validation.execute("Meter counts", () => validator.validateMeterCounts(data));
      validation.execute("Counts stay within total", () => validator.validateRelationships(data));
      validation.execute("Card totals", () => validator.validateAggregation(data));
      validation.execute("Previous values", () => validator.validatePreviousValues(data));
      validation.printSummary(testCase.testName, responseTime);
    });
  }

  test(
    "How many meters we have — all meters equals consumer plus DTR",
    { tag: ["@mis-dashboard", "@comm-stats", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new CommStatsApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommStatsValidator();
      const [allResult, consumerResult, dtrResult] = await Promise.all([
        api.getCommStats({ ...commStatsQuery, assetType: "all" }),
        api.getCommStats({ ...commStatsQuery, assetType: "consumer" }),
        api.getCommStats({ ...commStatsQuery, assetType: "dtr" }),
      ]);

      validation.execute("All meters status", () =>
        assert.validateStatusCode(allResult.rawResponse, 200),
      );
      validation.execute("Consumer status", () =>
        assert.validateStatusCode(consumerResult.rawResponse, 200),
      );
      validation.execute("DTR status", () => assert.validateStatusCode(dtrResult.rawResponse, 200));

      const allMeters = CommStatsMapper.mapCommStats(allResult.responseBody.data);
      const consumers = CommStatsMapper.mapCommStats(consumerResult.responseBody.data);
      const dtrs = CommStatsMapper.mapCommStats(dtrResult.responseBody.data);
      validation.execute("All equals consumer plus DTR", () =>
        validator.validateAllEqualsConsumerPlusDtr(allMeters, consumers, dtrs),
      );
      validation.printSummary(
        "How many meters we have — all meters equals consumer plus DTR",
        allResult.responseTime,
      );
    },
  );
});
