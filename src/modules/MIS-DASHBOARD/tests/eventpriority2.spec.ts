import { test } from "../../../fixtures/api.fixture";
import { EventPriorityApi } from "../Api/eventpriority2.api";
import { EventPriorityMapper } from "../Mapper/eventpriority2.mapper";
import { EventPriorityValidator } from "../Validator/eventpriority2.validator";
import { eventPriorityQueries } from "../Data/eventpriority2.data";
import { misUrgencyTitle } from "../Data/mis-dashboard-titles.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe.skip("Urgency level 2 events", {
  tag: ["@smoke", "@eventpriority2", "@mis-dashboard"],
}, () => {
  eventPriorityQueries.forEach((query) => {
    test(misUrgencyTitle(2, query.period), async ({ authenticatedApi }) => {
      const api = new EventPriorityApi(authenticatedApi);
      const result = await api.getPriorityData(query.priority, { period: query.period });
      const rawResponse = result.rawResponse;
      if (result.timeout || !rawResponse) {
        throw new Error(`Priority 2 ${query.period} request timed out`);
      }
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      validation.execute("Status", () => assert.validateStatusCode(rawResponse, 200));
      validation.execute("Content", () =>
        assert.validateContentType(rawResponse, "application/json"),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(result.responseTime, 120000),
      );
      const data = EventPriorityMapper.map(result.responseBody.data);
      const validator = new EventPriorityValidator();
      validation.execute("Response", () => validator.validateResponse(result.responseBody));
      validation.execute("Backend", () => validator.validate(data));
      validation.execute("No duplicate phase labels", () =>
        validator.validateUniqueRecordLabels(data),
      );
      validation.execute("No duplicate trend series names", () =>
        validator.validateUniqueTrendSeriesNames(data),
      );
      validation.execute("No duplicate trend point keys", () =>
        validator.validateUniqueTrendPointKeys(data),
      );
      validation.execute("Investigation", () =>
        validator.validateBackendInvestigation(data),
      );
      validation.printSummary(`Priority 2 ${query.period}`, result.responseTime);
    });
  });
});
