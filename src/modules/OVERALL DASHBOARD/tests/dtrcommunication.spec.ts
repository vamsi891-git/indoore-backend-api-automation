import { test } from "../../../fixtures/api.fixture";
import { DtrCommunicationApi } from "../Api/dtrcommunication.api";
import { DtrCommunicationMapper } from "../Mapper/dtrcommunication.mapper";
import { DtrCommunicationValidator } from "../Validator/dtrcommunication.validator";
import { dtrCommunicationQuery } from "../Data/dtrcommunication.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe("DTR Communication Status API", () => {
  test(
    "Validate DTR Communication Status",
    {
      tag: ["@smoke", "@dtr-communication"],
    },
    async ({ authenticatedApi }) => {
      const api = new DtrCommunicationApi(authenticatedApi);
      const {
        rawResponse,
        responseBody,
        responseTime,
      } = await api.getDtrCommunicationStatus(dtrCommunicationQuery);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      validation.execute(
        "Status Validation",
        () => assert.validateStatusCode(rawResponse, 200),
      );
      validation.execute(
        "Content Type",
        () => assert.validateContentType(rawResponse, "application/json"),
      );
      validation.execute(
        "Response Time",
        () => assert.validateResponseTime(responseTime, 30000),
      );
      validation.execute(
        "Security Validation",
        () => assert.validateSensitiveData(responseBody),
      );
      const data = DtrCommunicationMapper.mapData(responseBody.data);
      const validator = new DtrCommunicationValidator();
      validation.execute("Response Validation", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Non Negative", () =>
        validator.validateNonNegative(data),
      );
      validation.execute("Aggregation", () =>
        validator.validateAggregation(data),
      );
      validation.execute("Row Count", () => validator.validateRowsCount(data));
      validation.execute("Allowed Status", () =>
        validator.validateStatusValues(data),
      );
      validation.execute("Unique Meter", () =>
        validator.validateMeterUniqueness(data),
      );
      validation.execute("Day Trend", () => validator.validateDayTrend(data));
      validation.execute("Month Trend", () =>
        validator.validateMonthTrend(data),
      );
      validation.printSummary(
        "DTR Communication API",
        responseTime,
      );
    },
  );
});
