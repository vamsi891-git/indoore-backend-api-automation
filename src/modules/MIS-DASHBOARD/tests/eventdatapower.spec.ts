import { test } from "../../../fixtures/api.fixture";
import { EventPowerApi } from "../Api/eventdatapower.api";
import { EventPowerMapper } from "../Mapper/eventdatapower.mapper";
import { EventPowerValidator } from "../Validator/eventdatapower.validator";
import { eventPowerTestCases } from "../Data/eventdatapower.data";
import { MisDashboardEdgesValidator } from "../Validator/mis-dashboard.edges.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe("Power problems", () => {
  test.setTimeout(180_000);
  for (const testCase of eventPowerTestCases) {
    test(testCase.testName, { tag: testCase.tags }, async ({ authenticatedApi }) => {
      const api = new EventPowerApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } = await api.getPowerData(
        testCase.params,
      );
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new EventPowerValidator();
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

      const mapped = EventPowerMapper.map(responseBody.data);
      validation.execute("Response", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Power chart", () =>
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
    "Power problems — consumer and DTR stay within all meters",
    { tag: ["@mis-dashboard", "@event-data", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new EventPowerApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new EventPowerValidator();
      const query = {
        reportType: "phase-wise",
        period: "monthly",
        assetType: "all",
      };
      const [allResult, consumerResult, dtrResult] = await Promise.all([
        api.getPowerData({ ...query, assetType: "all" }),
        api.getPowerData({ ...query, assetType: "consumer" }),
        api.getPowerData({ ...query, assetType: "dtr" }),
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

      const allMeters = EventPowerMapper.map(allResult.responseBody.data);
      const consumers = EventPowerMapper.map(consumerResult.responseBody.data);
      const dtrs = EventPowerMapper.map(dtrResult.responseBody.data);
      validation.execute("Consumer counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, consumers),
      );
      validation.execute("DTR counts do not exceed all meters", () =>
        validator.validateSubsetDoesNotExceedAll(allMeters, dtrs),
      );
      validation.printSummary(
        "Power problems — consumer and DTR stay within all meters",
        allResult.responseTime,
      );
    },
  );
});
