import { test, isHesConfigured } from "../../../fixtures/hes.fixture";
import { MeterJobApi } from "../Api/meterjob.api";
import { QueryMeterJobApi } from "../Api/querymeterjob.api";
import { buildPingJob, hesMeterJobData } from "../Data/meterjob.data";
import { MeterJobMapper } from "../Mapper/meterjob.mapper";
import { MeterJobValidator } from "../Validator/meterjob.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe("HES Query Meter Job API", () => {
  test.beforeEach(() => {
    test.skip(!isHesConfigured(), "HES_BASE_URL not configured");
  });

  test(
    "query job after create",
    { tag: ["@hes", "@meter-job", "@query", "@smoke", "@phase1"] },
    async ({ hesApi }) => {
      const payload = buildPingJob();
      const createApi = new MeterJobApi(hesApi);
      const queryApi = new QueryMeterJobApi(hesApi);
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

      const queried = await queryApi.getJob(payload.jobName);

      validation.execute("Query Status", () =>
        assert.validateStatusCode(queried.rawResponse, 200, queried.responseBody)
      );

      const mapped = MeterJobMapper.mapQueryResponse(queried.responseBody);
      validation.execute("Query Summary", () =>
        validator.validateJobSummary(mapped, payload.jobName)
      );

      validation.printSummary("Query Meter Job", queried.responseTime);
    }
  );
});
