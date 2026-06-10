import { test } from "../../../fixtures/api.fixture";
import { DashboardMetricsApi } from "../Api/dashboardmetrics.api";
import { DashboardMetricsMapper } from "../Mapper/dashboardmetrics.mapper";
import { DashboardMetricsValidator } from "../Validator/dashboardmetrics.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
test.describe("Dashboard Metrics API", () => {
  test(
    "Validate Dashboard Metrics",
    {
      tag: ["@smoke", "@dashboard"],
    },
    async ({ authenticatedApi }) => {
      const api = new DashboardMetricsApi(authenticatedApi);
      const {
        rawResponse,
        responseBody,
        responseTime,
      } = await api.getDashboardMetrics();
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200),
      );
      validation.execute("Content Validation", () =>
        assert.validateContentType(rawResponse, "application/json"),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, 60000),
      );
      validation.execute("Security Validation", () =>
        assert.validateSensitiveData(responseBody),
      );
      const data = DashboardMetricsMapper.mapData(responseBody.data);
      const validator = new DashboardMetricsValidator();
      validation.execute("Response Validation", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Timestamp Validation", () =>
        validator.validateTimestamp(data),
      );
      validation.execute("Connection Validation", () =>
        validator.validateConnectionStatus(data),
      );
      validation.execute("Category Validation", () =>
        validator.validateCategoryWise(data),
      );
      validation.execute("Phase Validation", () =>
        validator.validatePhaseWise(data),
      );
      validation.execute("OEM Validation", () =>
        validator.validateOemWise(data),
      );
      validation.execute("Consumer Type Validation", () =>
        validator.validateConsumerType(data),
      );
      validation.execute("Network Validation", () =>
        validator.validateNetworkDetails(data),
      );
      validation.execute("Connection Percentage", () =>
        validator.validateConnectionPercentage(data),
      );
      validation.execute("Consumer Percentage", () =>
        validator.validateConsumerPercentage(data),
      );
      validation.printSummary("Dashboard Metrics API", responseTime);
    },
  );
});
