import { test } from "../../../fixtures/api.fixture";
import { EventClassificationApi } from "../Api/event-classification.api";
import { EventClassificationMapper } from "../Mapper/event-classification.mapper";
import { EventClassificationValidator } from "../Validator/event-classification.validator";
import { eventClassificationTestCases } from "../Data/event-classification.data";
import { MisDashboardEdgesValidator } from "../Validator/mis-dashboard.edges.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("What kinds of events happened", () => {
  for (const testCase of eventClassificationTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new EventClassificationApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getEventClassification(
        testCase.params,
      );
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new EventClassificationValidator();
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

      const data = EventClassificationMapper.map(responseBody.data);
      validation.execute("Response", () => validator.validateResponse(responseBody));
      validation.execute("Grouping", () =>
        validator.validateReportType(data, testCase.expectedReportType),
      );
      validation.execute("Today compared with yesterday", () => validator.validateDates(data));
      validation.execute("Totals add up", () => validator.validateTotals(data));
      validation.execute("Event type list", () => validator.validateClassifications(data));
      validation.execute("Expected event types", () => validator.validateExpectedCategories(data));
      validation.execute("Expected event type names", () => validator.validateLabelMappings(data));
      validation.execute("No duplicate event categories", () =>
        validator.validateUniqueCategories(data),
      );
      validation.execute("No duplicate event type names", () =>
        validator.validateUniqueLabels(data),
      );
      validation.printSummary(testCase.testName, responseTime);
    });
  }

  test(
    "What kinds of events happened — consumer and DTR stay within all meters",
    { tag: ["@mis-dashboard", "@classification", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new EventClassificationApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new EventClassificationValidator();
      const [allResult, consumerResult, dtrResult] = await Promise.all([
        api.getEventClassification({
          reportType: "phase-wise",
          assetType: "all",
        }),
        api.getEventClassification({
          reportType: "phase-wise",
          assetType: "consumer",
        }),
        api.getEventClassification({
          reportType: "phase-wise",
          assetType: "dtr",
        }),
      ]);

      validation.execute("All meters status", () =>
        assert.validateStatusCode(allResult.rawResponse, 200),
      );
      validation.execute("Consumer status", () =>
        assert.validateStatusCode(consumerResult.rawResponse, 200),
      );
      validation.execute("DTR status", () => assert.validateStatusCode(dtrResult.rawResponse, 200));

      const allMeters = EventClassificationMapper.map(allResult.responseBody.data);
      const consumers = EventClassificationMapper.map(consumerResult.responseBody.data);
      const dtrs = EventClassificationMapper.map(dtrResult.responseBody.data);
      validation.execute("Consumer counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, consumers),
      );
      validation.execute("DTR counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, dtrs),
      );
      validation.printSummary(
        "What kinds of events happened — consumer and DTR stay within all meters",
        allResult.responseTime,
      );
    },
  );
});
