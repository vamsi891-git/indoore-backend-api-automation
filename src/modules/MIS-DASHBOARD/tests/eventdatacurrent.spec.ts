import { test } from "../../../fixtures/api.fixture";
import { EventCurrentApi } from "../Api/eventdatacurrent.api";
import { EventCurrentMapper } from "../Mapper/eventdatacurrent.mapper";
import { EventCurrentValidator } from "../Validator/eventdatacurrent.validator";
import { eventCurrentTestCases } from "../Data/eventdatacurrent.data";
import { MisDashboardEdgesValidator } from "../Validator/mis-dashboard.edges.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe("Current problems", () => {
  test.setTimeout(180_000);
  for (const testCase of eventCurrentTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new EventCurrentApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getCurrentData(
        testCase.params,
      );
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new EventCurrentValidator();
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

      const mapped = EventCurrentMapper.map(responseBody.data);
      validation.execute("Response", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Current chart", () =>
        validator.validate(mapped, {
          reportType: testCase.expectedReportType,
          period: testCase.expectedPeriod,
        }),
      );
      validation.execute("No duplicate chart labels", () =>
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
    "Current problems — consumer and DTR stay within all meters",
    { tag: ["@mis-dashboard", "@event-data", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new EventCurrentApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new EventCurrentValidator();
      const query = {
        reportType: "phase-wise",
        period: "monthly",
        assetType: "all",
      };
      const [allResult, consumerResult, dtrResult] = await Promise.all([
        api.getCurrentData({ ...query, assetType: "all" }),
        api.getCurrentData({ ...query, assetType: "consumer" }),
        api.getCurrentData({ ...query, assetType: "dtr" }),
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

      const allMeters = EventCurrentMapper.map(allResult.responseBody.data);
      const consumers = EventCurrentMapper.map(consumerResult.responseBody.data);
      const dtrs = EventCurrentMapper.map(dtrResult.responseBody.data);
      validation.execute("Consumer counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, consumers),
      );
      validation.execute("DTR counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, dtrs),
      );
      validation.printSummary(
        "Current problems — consumer and DTR stay within all meters",
        allResult.responseTime,
      );
    },
  );
});
