import { test } from "../../../fixtures/api.fixture";
import { CommunicationTrendApi } from "../Api/communication-trend.api";
import { CommunicationTrendMapper } from "../Mapper/communication-trend.mapper";
import { CommunicationTrendValidator } from "../Validator/communication-trend.validator";
import {
  communicationTrendQuery,
  communicationTrendTestCases,
} from "../Data/communication-trend.data";
import { MisDashboardEdgesValidator } from "../Validator/mis-dashboard.edges.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Daily talking chart", () => {
  for (const testCase of communicationTrendTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new CommunicationTrendApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getTrend(testCase.params);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommunicationTrendValidator();
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

      validation.execute("Response", () => validator.validateResponse(responseBody));
      const data = CommunicationTrendMapper.map(responseBody.data);
      validation.execute("Date range", () =>
        validator.validateWindow(
          data,
          testCase.expectedFromDate,
          testCase.expectedToDate,
          testCase.expectSameDayWindow,
        ),
      );
      validation.execute("Daily trend", () => validator.validateTrend(data));
      validation.execute("No duplicate trend dates", () =>
        validator.validateUniqueTrendDates(data),
      );
      validation.execute("One trend point for every day in the range", () =>
        validator.validateTrendMatchesWindow(data),
      );
      if (testCase.expectZeroCounts) {
        validation.execute("No talking counts for this meter kind", () =>
          validator.validateZeroCounts(data),
        );
      }
      validation.printSummary(testCase.testName, responseTime);
    });
  }

  test(
    "Daily talking chart — consumer and DTR stay within all meters",
    { tag: ["@mis-dashboard", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new CommunicationTrendApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommunicationTrendValidator();
      const [allResult, consumerResult, dtrResult] = await Promise.all([
        api.getTrend({ ...communicationTrendQuery, assetType: "all" }),
        api.getTrend({ ...communicationTrendQuery, assetType: "consumer" }),
        api.getTrend({ ...communicationTrendQuery, assetType: "dtr" }),
      ]);

      validation.execute("All meters status", () =>
        assert.validateStatusCode(allResult.rawResponse, 200),
      );
      validation.execute("Consumer status", () =>
        assert.validateStatusCode(consumerResult.rawResponse, 200),
      );
      validation.execute("DTR status", () => assert.validateStatusCode(dtrResult.rawResponse, 200));

      const allMeters = CommunicationTrendMapper.map(allResult.responseBody.data);
      const consumers = CommunicationTrendMapper.map(consumerResult.responseBody.data);
      const dtrs = CommunicationTrendMapper.map(dtrResult.responseBody.data);

      validation.execute("Same dates for all and consumer", () =>
        validator.validateSameDates(allMeters.communicationTrend, consumers.communicationTrend),
      );
      validation.execute("Same dates for all and DTR", () =>
        validator.validateSameDates(allMeters.communicationTrend, dtrs.communicationTrend),
      );
      validation.execute("Consumer counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, consumers),
      );
      validation.execute("DTR counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, dtrs),
      );
      validation.printSummary(
        "Daily talking chart — consumer and DTR stay within all meters",
        allResult.responseTime,
      );
    },
  );
});
