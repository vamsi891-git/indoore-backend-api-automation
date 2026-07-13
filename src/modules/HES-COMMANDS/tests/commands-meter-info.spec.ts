import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { CommandsMeterInfoApi } from "../Api/commands-meter-info.api";
import {buildCommandsMeterInfoPath, commandsMeterData,} from "../Data/commands-meter.data";
import { CommandsMeterInfoMapper } from "../Mapper/commands-meter-info.mapper";
import { CommandsMeterInfoValidator } from "../Validator/commands-meter-info.validator";
test.describe("HES Commands — Meter Info", () => {
  test.setTimeout(120_000);
  test("Validate GET /commands/meter-info/:serial — HES device metadata",
    { tag: ["@smoke", "@commands", "@hes", "@commands-meter-info"] },
    async ({ authenticatedApi }, testInfo) => {
      const serial = commandsMeterData.validMeterSerial;
      const api = new CommandsMeterInfoApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsMeterInfoValidator();
      const { rawResponse, responseBody, responseTime } =
        await api.getMeterInfo(serial);
      const url = `${process.env.BASE_URL}${buildCommandsMeterInfoPath(serial)}`;
      await PerformanceTracker.track(
        rawResponse,
        "Commands Meter Info",
        rawResponse.url(),
        responseTime
      );
      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Meter Info",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsMeterData.maxResponseTimeMs,
      });
      validation.execute("Success Response", () =>
        validator.validateResponse(responseBody),
      );
      const row = CommandsMeterInfoMapper.mapResponse(responseBody);
      validation.execute("Meter ID", () =>
        validator.validateMeterId(row, serial),
      );
      validation.execute("Node ID", () => validator.validateNodeId(row));
      validation.execute("Vendor", () => validator.validateVendor(row));
      validation.execute("Firmware Version", () =>
        validator.validateFirmwareVersion(row),
      );
      validation.execute("String Fields Trimmed", () =>
        validator.validateStringFieldsTrimmed(row),
      );
      validation.execute("Hardware Version", () =>
        validator.validateHardwareVersion(row),
      );
      validation.execute("Timestamps", () => validator.validateTimestamps(row));
      validation.execute("Full API Contract", () =>
        validator.validateFullMeterInfo(row, serial),
      );
      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Meter Info",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "GET",
          requestParams: { serial },
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "200 with HES meterId, nodeId, vendor, firmware/hardware version, createTime, updateTime.",
        },
      });
    },
  );
  test("Validate GET /commands/meter-info/:serial — unknown meter returns error",
    { tag: ["@commands", "@hes", "@commands-meter-info", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const serial = commandsMeterData.unknownMeterSerial;
      const api = new CommandsMeterInfoApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsMeterInfoValidator();
      const { rawResponse, responseBody, responseTime } =
        await api.getMeterInfo(serial);
      const label = "Commands Meter Info — Unknown Serial";
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
            requestParams: { serial },
            responseStatus: status,
            responseBody,
            expectedBehavior:
              "404 with error envelope for unknown serial (backend may return 500 INTERNAL_ERROR).",
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
          requestParams: { serial },
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "Unknown or out-of-scope serial returns 404 with error envelope.",
        },
      });
    },
  );
});
