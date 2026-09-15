import { test } from "../../../fixtures/api.fixture";
import { EventPriorityApi } from "../Api/eventpriority1.api";
import { EventPriorityMapper } from "../Mapper/eventpriority1.mapper";
import { EventPriorityValidator } from "../Validator/eventpriority1.validator";
import { eventPriorityQueries } from "../Data/eventpriority1.data";
import { misUrgencyTitle } from "../Data/mis-dashboard-titles.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe.skip("Urgency level 1 events (extra check)", () => {
  eventPriorityQueries.forEach((query) => {
    test(
      misUrgencyTitle(1, query.period, "extra check"),
      { tag: ["@smoke", "@mis-dashboard"] },
      async ({ authenticatedApi }) => {
        const api = new EventPriorityApi(authenticatedApi);
        const result = await api.getPriorityData(query.priority, {
          period: query.period,
        });
        if (result.timeout || !result.rawResponse) {
          throw new Error(`Priority 1 ${query.period} request timed out`);
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
        const data = EventPriorityMapper.map(result.responseBody.data);
        const validator = new EventPriorityValidator();
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
        validation.printSummary(`Priority 1 ${query.period}`, result.responseTime);
      },
    );
  });
});
