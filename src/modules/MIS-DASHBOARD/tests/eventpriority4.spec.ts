import { test } from "../../../fixtures/api.fixture";
import { EventPriorityApi } from "../Api/eventpriority4.api";
import { EventPriorityMapper } from "../Mapper/eventpriority4.mapper";
import { EventPriorityValidator } from "../Validator/eventpriority4.validator";
import {
  eventPriorityPath,
  eventPriorityTestCases,
} from "../Data/eventpriority4.data";
import { MisDashboardEdgesValidator } from "../Validator/mis-dashboard.edges.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe("Urgency level 4 events", () => {
  test.setTimeout(180_000);
  for (const testCase of eventPriorityTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new EventPriorityApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getPriorityData(testCase.priority, testCase.params);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new EventPriorityValidator();
      const edges = new MisDashboardEdgesValidator();

      validation.execute("Status", () =>
        assert.validateStatusCode(
          rawResponse,
          testCase.expectedStatus,
          responseBody,
        ),
      );
      validation.execute("Content", () =>
        assert.validateContentType(rawResponse, "application/json"),
      );
      validation.execute("Performance", () =>
        assert.validateResponseTime(responseTime, 120000),
      );
      validation.execute("Sensitive Data", () =>
        assert.validateSensitiveData(responseBody),
      );

      if (testCase.expectedStatus !== 200) {
        validation.execute("Error code", () =>
          edges.validateValidationError(responseBody),
        );
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      const mapped = EventPriorityMapper.map(responseBody.data);
      validation.execute("Response", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Urgency chart", () =>
        validator.validate(mapped, {
          period: testCase.expectedPeriod,
          priorityId: testCase.expectedPriorityId,
          label: testCase.expectedLabel,
        }),
      );
      validation.execute("No duplicate phase labels", () =>
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
    "Urgency level 4 events — consumer and DTR stay within all meters",
    { tag: ["@mis-dashboard", "@event-data", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new EventPriorityApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new EventPriorityValidator();
      const query = { period: "monthly", assetType: "all" };
      const [allResult, consumerResult, dtrResult] = await Promise.all([
        api.getPriorityData(eventPriorityPath, { ...query, assetType: "all" }),
        api.getPriorityData(eventPriorityPath, {
          ...query,
          assetType: "consumer",
        }),
        api.getPriorityData(eventPriorityPath, { ...query, assetType: "dtr" }),
      ]);

      validation.execute("All meters status", () =>
        assert.validateStatusCode(allResult.rawResponse, 200),
      );
      validation.execute("Consumer status", () =>
        assert.validateStatusCode(consumerResult.rawResponse, 200),
      );
      validation.execute("DTR status", () =>
        assert.validateStatusCode(dtrResult.rawResponse, 200),
      );

      const allMeters = EventPriorityMapper.map(allResult.responseBody.data);
      const consumers = EventPriorityMapper.map(consumerResult.responseBody.data);
      const dtrs = EventPriorityMapper.map(dtrResult.responseBody.data);
      validation.execute("Consumer counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, consumers),
      );
      validation.execute("DTR counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, dtrs),
      );
      validation.printSummary(
        "Urgency level 4 events — consumer and DTR stay within all meters",
        allResult.responseTime,
      );
    },
  );
});
