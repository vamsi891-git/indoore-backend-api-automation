import { test } from "../../../fixtures/api.fixture";
import { EventPriorityApi } from "../Api/eventpriority5.api";
import { EventPriorityMapper } from "../Mapper/eventpriority5.mapper";
import { EventPriorityValidator } from "../Validator/eventpriority5.validator";
import { eventPriorityQueries } from "../Data/eventpriority5.data";
import { misUrgencyTitle } from "../Data/mis-dashboard-titles.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe.skip("Urgency level 5 events", () => {
  eventPriorityQueries.forEach((query) => {
    test(
      misUrgencyTitle(5, query.period),
      { tag: ["@smoke", "@mis-dashboard"] },
      async ({ authenticatedApi }) => {
        const api = new EventPriorityApi(authenticatedApi);
        const result = await api.getPriorityData(query.priority, {
          period: query.period,
        });
        if (result.timeout || !result.rawResponse) {
          throw new Error(`Priority 5 ${query.period} request timed out`);
        }
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        validation.execute("Status", () =>
          assert.validateStatusCode(result.rawResponse!, 200),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(result.rawResponse!),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(result.responseTime, 120000),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(result.responseBody),
        );
        const data = EventPriorityMapper.map(result.responseBody.data);
        const validator = new EventPriorityValidator();
        validation.execute("Response", () =>
          validator.validateResponse(result.responseBody),
        );
        validation.execute("Backend Validation", () => validator.validate(data));
        validation.execute("No duplicate phase labels", () =>
          validator.validateDuplicateLabels(data),
        );
        validation.execute("No duplicate trend series names", () =>
          validator.validateUniqueTrendSeriesNames(data),
        );
        validation.execute("No duplicate trend point keys", () =>
          validator.validateUniqueTrendPointKeys(data),
        );
        validation.execute("Investigation", () =>
          validator.validateBusinessInvestigation(data),
        );
        validation.printSummary(`Priority 5 ${query.period}`, result.responseTime);
      },
    );
  });
});
