import { test, isHesConfigured } from "../../../fixtures/hes.fixture";
import { MeterJobApi } from "../Api/meterjob.api";
import { MeterStatusForJobApi } from "../Api/meterstatusforjob.api";
import { buildPingJob, hesMeterJobData } from "../Data/meterjob.data";
import { MeterJobMapper } from "../Mapper/meterjob.mapper";
import { MeterJobValidator } from "../Validator/meterjob.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe("HES Meter Status For Job API", () => {
  test.beforeEach(() => {
    test.skip(!isHesConfigured(), "HES_BASE_URL not configured");
  });

  test(
    "meter status after job create",
    { tag: ["@hes", "@meter-job", "@status", "@smoke", "@phase1"] },
    async ({ hesApi }) => {
      const payload = buildPingJob();
      const createApi = new MeterJobApi(hesApi);
      const statusApi = new MeterStatusForJobApi(hesApi);
      const validation = new ValidationEngine();
      const assert = new AssertionEngine();
      const validator = new MeterJobValidator();

      const created = await createApi.createJob(payload);
      validation.execute("Create Status", () =>
        assert.validateStatusCode(
          created.rawResponse,
          hesMeterJobData.expectedCreatedStatus,
          created.responseBody
        )
      );

      const status = await statusApi.getStatus(payload.jobName);
      validation.execute("Status API", () =>
        assert.validateStatusCode(status.rawResponse, 200, status.responseBody)
      );

      const rows = MeterJobMapper.mapMeterStatusRows(status.responseBody);
      if (rows.length > 0) {
        validation.execute("Meter Status Rows", () =>
          validator.validateMeterStatusRows(rows)
        );
      }

      validation.printSummary("Meter Status For Job", status.responseTime);
    }
  );
});
