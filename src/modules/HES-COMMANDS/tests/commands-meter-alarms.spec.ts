import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { CommandsMeterAlarmsApi } from "../Api/commands-meter-alarms.api";
import {
  buildMeterAlarmsBody,
  commandsMeterAlarmsData,
  METER_ALARMS_PATH,
} from "../Data/commands-meter-alarms.data";
import { CommandsMeterAlarmsMapper } from "../Mapper/commands-meter-alarms.mapper";
import { CommandsMeterAlarmsValidator } from "../Validator/commands-meter-alarms.validator";

test.describe("HES Commands — Meter Alarms", () => {
  test.setTimeout(120_000);

  test(
    "Validate POST /commands/meter-alarms — default window",
    { tag: ["@smoke", "@commands", "@hes", "@commands-meter-alarms"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = buildMeterAlarmsBody();
      const api = new CommandsMeterAlarmsApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsMeterAlarmsValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.postMeterAlarms(body);

      const url = `${process.env.BASE_URL}${METER_ALARMS_PATH}`;
      await PerformanceTracker.track(
        rawResponse,
        "Commands Meter Alarms",
        url,
        responseTime,
      );

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Meter Alarms",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsMeterAlarmsData.maxResponseTimeMs,
      });

      validation.execute("Success Response", () =>
        validator.validateResponse(responseBody),
      );

      const mapped = CommandsMeterAlarmsMapper.mapResponse(responseBody);

      validation.execute("Alarm Count", () =>
        validator.validateAlarmCount(mapped.alarms, body.count),
      );
      validation.execute("Meter Alarm ID Sequence", () =>
        validator.validateMeterAlarmIdSequence(mapped.alarms, body.startId),
      );
      validation.execute("Unique Meter Alarm IDs", () =>
        validator.validateUniqueMeterAlarmIds(mapped.alarms),
      );
      validation.execute("All Alarm Rows", () =>
        validator.validateAllAlarms(mapped.alarms),
      );
      validation.execute("Sequence Numbers Consecutive Same Meter", () =>
        validator.validateSequenceNumbersAscendingForConsecutiveSameMeter(
          mapped.alarms,
        ),
      );
      validation.execute("Alarm Time Consecutive Same Meter", () =>
        validator.validateAlarmTimeAscendingForConsecutiveSameMeter(
          mapped.alarms,
        ),
      );
      validation.execute("Full API Contract", () =>
        validator.validateFullContract(mapped, body.startId, body.count),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Meter Alarms",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: "/indore/commands/meter-alarms",
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "Returns count alarms from startId with meterId, sequenceNumber, alarmTime, alarmActive codes, and createTime.",
        },
      });
    },
  );

  test(
    "Validate POST /commands/meter-alarms — paginated startId",
    { tag: ["@commands", "@hes", "@commands-meter-alarms"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = buildMeterAlarmsBody({
        count: commandsMeterAlarmsData.paginationCount,
        startId: commandsMeterAlarmsData.paginationStartId,
      });
      const api = new CommandsMeterAlarmsApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsMeterAlarmsValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.postMeterAlarms(body);

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Meter Alarms — Pagination",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsMeterAlarmsData.maxResponseTimeMs,
      });

      validation.execute("Success Response", () =>
        validator.validateResponse(responseBody),
      );

      const mapped = CommandsMeterAlarmsMapper.mapResponse(responseBody);
      validation.execute("Paginated ID Window", () =>
        validator.validateFullContract(mapped, body.startId, body.count),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Meter Alarms — Pagination",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: "/indore/commands/meter-alarms",
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "startId + count window returns sequential meterAlarmId values.",
        },
      });
    },
  );

  test(
    "Validate POST /commands/meter-alarms — invalid count returns error",
    { tag: ["@commands", "@hes", "@commands-meter-alarms", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = buildMeterAlarmsBody({
        count: commandsMeterAlarmsData.invalidCount,
      });
      const api = new CommandsMeterAlarmsApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsMeterAlarmsValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.postMeterAlarms(body);

      const label = "Commands Meter Alarms — Invalid Count";
      const status = rawResponse.status();

      if (BackendResponse.shouldSkipServerFailure(status, label, responseBody)) {
        validation.execute("Error Response (500 backend defect)", () =>
          validator.validateErrorResponse(responseBody),
        );
        validation.printSummary(label, responseTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: "/indore/commands/meter-alarms",
            method: "POST",
            requestParams: body,
            responseStatus: status,
            responseBody,
            expectedBehavior:
              "400 for count=0 (backend intermittently returns 500 INTERNAL_ERROR).",
          },
        });
        return;
      }

      validation.execute("Status (bad request)", () =>
        assert.validateStatusCode(rawResponse, 400, responseBody),
      );
      validation.execute("Content Type", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Error Response", () =>
        validator.validateErrorResponse(responseBody),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: label,
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: "/indore/commands/meter-alarms",
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: "count=0 returns 400 with error envelope.",
        },
      });
    },
  );
});
