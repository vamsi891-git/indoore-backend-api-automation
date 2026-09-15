import { test } from "../../../fixtures/api.fixture";
import { EventPriorityOverviewApi } from "../Api/eventpriorityoverview.api";
import { EventPriorityOverviewMapper } from "../Mapper/eventpriorityoverview.mapper";
import { EventPriorityOverviewValidator } from "../Validator/eventpriorityoverview.validator";
import { eventPriorityOverviewTestCases } from "../Data/eventpriorityoverview.data";
import { MisDashboardEdgesValidator } from "../Validator/mis-dashboard.edges.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe("Urgency today versus yesterday", () => {
  for (const testCase of eventPriorityOverviewTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new EventPriorityOverviewApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getPriorityOverview(testCase.params);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new EventPriorityOverviewValidator();
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

      const mapped = EventPriorityOverviewMapper.map(responseBody.data);
      validation.execute("Response", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Urgency comparison", () => validator.validate(mapped));
      validation.execute("No duplicate urgency numbers", () =>
        validator.validateUniquePriorityIds(mapped),
      );
      validation.execute("No duplicate urgency names", () =>
        validator.validateUniquePriorityLabels(mapped),
      );
      validation.printSummary(testCase.testName, responseTime);
    });
  }

  test(
    "Urgency today versus yesterday — consumer and DTR stay within all meters",
    { tag: ["@mis-dashboard", "@event-data", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new EventPriorityOverviewApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new EventPriorityOverviewValidator();
      const [allResult, consumerResult, dtrResult] = await Promise.all([
        api.getPriorityOverview({ assetType: "all" }),
        api.getPriorityOverview({ assetType: "consumer" }),
        api.getPriorityOverview({ assetType: "dtr" }),
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

      const allMeters = EventPriorityOverviewMapper.map(
        allResult.responseBody.data,
      );
      const consumers = EventPriorityOverviewMapper.map(
        consumerResult.responseBody.data,
      );
      const dtrs = EventPriorityOverviewMapper.map(dtrResult.responseBody.data);
      validation.execute("Consumer counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, consumers),
      );
      validation.execute("DTR counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, dtrs),
      );
      validation.printSummary(
        "Urgency today versus yesterday — consumer and DTR stay within all meters",
        allResult.responseTime,
      );
    },
  );
});
