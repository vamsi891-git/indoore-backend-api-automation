import { test } from "../../../fixtures/api.fixture";
import type { APIRequestContext } from "@playwright/test";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { EventPriorityApi } from "../Api/eventpriority.api";
import { EventPriorityMapper } from "../Mapper/eventpriority.mapper";
import { EventPriorityOverviewMapper } from "../Mapper/eventpriorityoverview.mapper";
import { EventPriorityOverviewValidator } from "../Validator/eventpriorityoverview.validator";
import { EventPriorityValidator } from "../Validator/eventpriority.validator";
import { MisDashboardEdgesValidator } from "../Validator/mis-dashboard.edges.validator";
import {
  misDashboardEdgeCases,
  type MisDashboardEdgeCase,
} from "../Data/mis-dashboard.edges.data";

async function callEdge(
  authenticatedApi: APIRequestContext,
  testCase: MisDashboardEdgeCase,
) {
  return new EventPriorityApi(authenticatedApi).getPriorityData(
    testCase.priority ?? "Priority1",
    testCase.params,
  );
}

test.describe("Unusual or invalid requests", () => {
  for (const testCase of misDashboardEdgeCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const result = await callEdge(authenticatedApi, testCase);
      const rawResponse = result.rawResponse;
      if (!rawResponse) {
        throw new Error(`${testCase.testName} request timed out`);
      }
      const responseBody = result.responseBody;
      const responseTime = result.responseTime;
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const edges = new MisDashboardEdgesValidator();

      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, testCase.expectedStatus, responseBody),
      );
      validation.execute("Content Type", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, 120000),
      );
      validation.execute("Sensitive Data", () =>
        assert.validateSensitiveData(responseBody),
      );

      if (testCase.expectedStatus !== 200) {
        validation.execute("Error code", () =>
          edges.validateExpectedError(responseBody, testCase.expectedErrorCode!),
        );
        validation.printSummary(testCase.testName, responseTime);
        return;
      }

      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success", "data"]),
      );

      if (testCase.family === "priority-wise") {
        if (Array.isArray(responseBody.data?.priorities)) {
          const data = EventPriorityOverviewMapper.map(responseBody.data);
          const validator = new EventPriorityOverviewValidator();
          validation.execute("No duplicate priority numbers", () =>
            validator.validateDuplicatePriority(data),
          );
        } else {
          const data = EventPriorityMapper.map(responseBody.data);
          const validator = new EventPriorityValidator();
          validation.execute("No duplicate phase labels", () =>
            validator.validateUniqueRecordLabels(data),
          );
          validation.execute("No duplicate trend series names", () =>
            validator.validateUniqueTrendSeriesNames(data),
          );
          validation.execute("No duplicate trend point keys", () =>
            validator.validateUniqueTrendPointKeys(data),
          );
        }
      }

      validation.printSummary(testCase.testName, responseTime);
    });
  }
});
