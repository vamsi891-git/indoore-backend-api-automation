import { test } from "../../../fixtures/api.fixture";
import { EventDataApi } from "../Api/eventdata.api";
import { EventDataMapper } from "../Mapper/eventdata.mapper";
import { EventDataValidator } from "../Validator/eventdata.validator";
import { eventDataTestCases } from "../Data/eventdata.data";
import { MisDashboardEdgesValidator } from "../Validator/mis-dashboard.edges.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Event summary", () => {
  for (const testCase of eventDataTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new EventDataApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getEventData(testCase.params);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new EventDataValidator();
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

      const mapped = EventDataMapper.map(responseBody.data);
      validation.execute("Response", () => validator.validateResponse(responseBody));
      validation.execute("Event summary", () =>
        validator.validate(mapped, testCase.expectedReportType),
      );
      if (testCase.expectedReportType === "priority-wise") {
        validation.execute("No duplicate urgency numbers", () =>
          validator.validateUniquePriorityIds(mapped),
        );
      } else {
        validation.execute("No duplicate event categories", () =>
          validator.validateUniqueClassificationCategories(mapped),
        );
      }
      validation.printSummary(testCase.testName, responseTime);
    });
  }

  test(
    "Event summary — consumer and DTR stay within all meters",
    { tag: ["@mis-dashboard", "@event-data", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new EventDataApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new EventDataValidator();
      const query = {
        reportType: "phase-wise",
        period: "daily",
        assetType: "all",
      };
      const [allResult, consumerResult, dtrResult] = await Promise.all([
        api.getEventData({ ...query, assetType: "all" }),
        api.getEventData({ ...query, assetType: "consumer" }),
        api.getEventData({ ...query, assetType: "dtr" }),
      ]);

      validation.execute("All meters status", () =>
        assert.validateStatusCode(allResult.rawResponse, 200),
      );
      validation.execute("Consumer status", () =>
        assert.validateStatusCode(consumerResult.rawResponse, 200),
      );
      validation.execute("DTR status", () => assert.validateStatusCode(dtrResult.rawResponse, 200));

      const allMeters = EventDataMapper.map(allResult.responseBody.data);
      const consumers = EventDataMapper.map(consumerResult.responseBody.data);
      const dtrs = EventDataMapper.map(dtrResult.responseBody.data);
      validation.execute("Consumer counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, consumers),
      );
      validation.execute("DTR counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, dtrs),
      );
      validation.printSummary(
        "Event summary — consumer and DTR stay within all meters",
        allResult.responseTime,
      );
    },
  );

  test(
    "Event summary — urgency consumer and DTR stay within all meters",
    { tag: ["@mis-dashboard", "@event-data", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new EventDataApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new EventDataValidator();
      const query = {
        reportType: "priority-wise",
        period: "daily",
        assetType: "all",
      };
      const [allResult, consumerResult, dtrResult] = await Promise.all([
        api.getEventData({ ...query, assetType: "all" }),
        api.getEventData({ ...query, assetType: "consumer" }),
        api.getEventData({ ...query, assetType: "dtr" }),
      ]);

      validation.execute("All meters status", () =>
        assert.validateStatusCode(allResult.rawResponse, 200),
      );
      validation.execute("Consumer status", () =>
        assert.validateStatusCode(consumerResult.rawResponse, 200),
      );
      validation.execute("DTR status", () => assert.validateStatusCode(dtrResult.rawResponse, 200));

      const allMeters = EventDataMapper.map(allResult.responseBody.data);
      const consumers = EventDataMapper.map(consumerResult.responseBody.data);
      const dtrs = EventDataMapper.map(dtrResult.responseBody.data);
      validation.execute("Consumer counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, consumers),
      );
      validation.execute("DTR counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, dtrs),
      );
      validation.printSummary(
        "Event summary — urgency consumer and DTR stay within all meters",
        allResult.responseTime,
      );
    },
  );
});
