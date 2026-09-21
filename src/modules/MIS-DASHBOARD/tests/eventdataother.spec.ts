import { test } from "../../../fixtures/api.fixture";
import { EventOtherApi } from "../Api/eventdataother.api";
import { EventOtherMapper } from "../Mapper/eventdataother.mapper";
import { EventOtherValidator } from "../Validator/eventdataother.validator";
import { eventOtherTestCases } from "../Data/eventdataother.data";
import { MisDashboardEdgesValidator } from "../Validator/mis-dashboard.edges.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Other events", () => {
  test.setTimeout(180_000);
  for (const testCase of eventOtherTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new EventOtherApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getOtherData(testCase.params);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new EventOtherValidator();
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

      const mapped = EventOtherMapper.map(responseBody.data);
      validation.execute("Response", () => validator.validateResponse(responseBody));
      validation.execute("Other events chart", () =>
        validator.validate(mapped, {
          reportType: testCase.expectedReportType,
          period: testCase.expectedPeriod,
        }),
      );
      validation.execute("No duplicate chart labels", () =>
        validator.validateUniqueRecordLabels(mapped),
      );
      validation.execute("No duplicate trend series names", () =>
        validator.validateUniqueTrendSeriesNames(mapped),
      );
      validation.execute("No duplicate trend point keys", () =>
        validator.validateUniqueTrendPointKeys(mapped),
      );
      validation.printSummary(testCase.testName, responseTime);
    });
  }

  test(
    "Other events — consumer and DTR stay within all meters",
    { tag: ["@mis-dashboard", "@event-data", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new EventOtherApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new EventOtherValidator();
      const query = {
        reportType: "phase-wise",
        period: "monthly",
        assetType: "all",
      };
      const [allResult, consumerResult, dtrResult] = await Promise.all([
        api.getOtherData({ ...query, assetType: "all" }),
        api.getOtherData({ ...query, assetType: "consumer" }),
        api.getOtherData({ ...query, assetType: "dtr" }),
      ]);

      validation.execute("All meters status", () =>
        assert.validateStatusCode(allResult.rawResponse, 200),
      );
      validation.execute("Consumer status", () =>
        assert.validateStatusCode(consumerResult.rawResponse, 200),
      );
      validation.execute("DTR status", () => assert.validateStatusCode(dtrResult.rawResponse, 200));

      const allMeters = EventOtherMapper.map(allResult.responseBody.data);
      const consumers = EventOtherMapper.map(consumerResult.responseBody.data);
      const dtrs = EventOtherMapper.map(dtrResult.responseBody.data);
      validation.execute("Consumer counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, consumers),
      );
      validation.execute("DTR counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, dtrs),
      );
      validation.printSummary(
        "Other events — consumer and DTR stay within all meters",
        allResult.responseTime,
      );
    },
  );
});
