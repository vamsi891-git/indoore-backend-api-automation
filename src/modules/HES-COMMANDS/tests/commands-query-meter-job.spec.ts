import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { CommandsQueryMeterJobApi } from "../Api/commands-query-meter-job.api";
import {
  buildQueryMeterJobPath,
  commandsQueryMeterJobData,
} from "../Data/commands-query-meter-job.data";
import { CommandsQueryMeterJobMapper } from "../Mapper/commands-query-meter-job.mapper";
import { CommandsQueryMeterJobValidator } from "../Validator/commands-query-meter-job.validator";

test.describe("HES Commands — Query Meter Job", () => {
  test.setTimeout(120_000);

  test(
    "Validate GET /commands/query-meter-job/:jobName — known job status",
    { tag: ["@smoke", "@commands", "@hes", "@commands-query-meter-job"] },
    async ({ authenticatedApi }, testInfo) => {
      const jobName = commandsQueryMeterJobData.knownJobName;
      const api = new CommandsQueryMeterJobApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsQueryMeterJobValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.getQueryMeterJob(jobName);

      const url = `${process.env.BASE_URL}${buildQueryMeterJobPath(jobName)}`;
      await PerformanceTracker.track(
        rawResponse,
        "Commands Query Meter Job",
        rawResponse.url(),
        responseTime
      );

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Query Meter Job",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsQueryMeterJobData.maxResponseTimeMs,
      });

      validation.execute("Success Response", () =>
        validator.validateResponse(responseBody),
      );

      const mapped = CommandsQueryMeterJobMapper.mapResponse(responseBody);

      validation.execute("Job Name Echo", () =>
        validator.validateJobNameEcho(mapped, jobName),
      );
      validation.execute("Sync Flags", () =>
        validator.validateSyncFlags(mapped),
      );
      validation.execute("HES Job Status", () =>
        validator.validateHesJobStatus(mapped),
      );
      validation.execute("HES Status Code", () =>
        validator.validateHesStatusCode(mapped),
      );
      validation.execute("Summary Counts", () =>
        validator.validateSummaryCounts(mapped.job.summary),
      );
      validation.execute("Summary vs Meter Results", () =>
        validator.validateSummaryMatchesMeterResults(
          mapped.job.summary,
          mapped.job.meterResults,
        ),
      );
      validation.execute("Meter Results Present", () =>
        validator.validateMeterResultsPresent(mapped.job.meterResults),
      );
      validation.execute("All Meter Result Rows", () =>
        validator.validateAllMeterResults(mapped.job.meterResults),
      );
      validation.execute("Status Summary Alignment", () =>
        validator.validateStatusSummaryAlignment(
          mapped.job.summary,
          mapped.job.meterResults,
        ),
      );
      validation.execute("HES Unreachable Message Rules", () =>
        validator.validateHesUnreachableMessage(mapped),
      );
      validation.execute("Expected Meter Present", () =>
        validator.validateExpectedMeterPresent(
          mapped.job.meterResults,
          commandsQueryMeterJobData.expectedMeterId,
        ),
      );
      validation.execute("Full API Contract", () =>
        validator.validateFullContract(
          mapped,
          jobName,
          commandsQueryMeterJobData.expectedMeterId,
        ),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Query Meter Job",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "GET",
          requestParams: { jobName },
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "200 with jobName echo, summary counts summing to requested, and meterResults from hes_command_logs (status/action/hesStatusCode/errorMessage).",
        },
      });
    },
  );

  test(
    "Validate GET /commands/query-meter-job/:jobName — unknown job returns error",
    { tag: ["@commands", "@hes", "@commands-query-meter-job", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const jobName = commandsQueryMeterJobData.unknownJobName;
      const api = new CommandsQueryMeterJobApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsQueryMeterJobValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.getQueryMeterJob(jobName);

      const label = "Commands Query Meter Job — Unknown Job";
      const status = rawResponse.status();

      if (BackendResponse.shouldSkipServerFailure(status, label, responseBody)) {
        validation.execute("Error Response (500 backend defect)", () =>
          validator.validateErrorResponse(responseBody),
        );
        validation.printSummary(label, responseTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: rawResponse.url(),
            method: "GET",
            requestParams: { jobName },
            responseStatus: status,
            responseBody,
            expectedBehavior:
              "404 for unknown job name (backend intermittently returns 500 INTERNAL_ERROR).",
          },
        });
        return;
      }

      validation.execute("Status (not found)", () =>
        assert.validateStatusCode(rawResponse, 404, responseBody),
      );
      validation.execute("Content Type", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Error Response", () =>
        validator.validateNotFoundResponse(responseBody),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: label,
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "GET",
          requestParams: { jobName },
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "Unknown job name returns 404 with error envelope.",
        },
      });
    },
  );
});
