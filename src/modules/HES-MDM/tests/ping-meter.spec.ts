import { test, isHesConfigured } from "../../../fixtures/hes.fixture";
import { MeterPingApi } from "../Api/meterping.api";
import { MeterJobApi } from "../Api/meterjob.api";
import { buildPingJob, hesMeterJobData } from "../Data/meterjob.data";
import { MeterJobValidator } from "../Validator/meterjob.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

const testMeterId = process.env.HES_TEST_METER_ID ?? "TEST_METER_001";

test.describe("HES Ping Meter", () => {
  test.beforeEach(() => {
    test.skip(!isHesConfigured(), "HES_BASE_URL not configured");
  });

  test(
    "async ping via meterJob",
    { tag: ["@hes", "@ping", "@async", "@smoke", "@phase1"] },
    async ({ hesApi }) => {
      const payload = buildPingJob();
      const api = new MeterJobApi(hesApi);
      const validation = new ValidationEngine();
      const assert = new AssertionEngine();

      const result = await api.createJob(payload);

      validation.execute("Status", () =>
        assert.validateStatusCode(
          result.rawResponse,
          hesMeterJobData.expectedCreatedStatus,
          result.responseBody
        )
      );

      validation.printSummary("Ping Meter — async", result.responseTime);
    }
  );

  test(
    "sync ping via meterPing",
    { tag: ["@hes", "@ping", "@sync", "@smoke", "@phase1"] },
    async ({ hesApi }) => {
      const api = new MeterPingApi(hesApi);
      const validator = new MeterJobValidator();
      const validation = new ValidationEngine();
      const assert = new AssertionEngine();

      const result = await api.ping(testMeterId);

      validation.execute("Status", () =>
        assert.validateStatusCode(result.rawResponse, 200, result.responseBody)
      );
      validation.execute("Content Type", () =>
        assert.validateContentType(result.rawResponse, "application/json")
      );
      validation.execute("Ping Response", () =>
        validator.validatePingResponse(result.responseBody)
      );

      validation.printSummary("Ping Meter — sync", result.responseTime);
    }
  );
});
