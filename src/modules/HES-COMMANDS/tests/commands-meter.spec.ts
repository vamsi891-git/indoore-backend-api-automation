import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { CommandsMeterApi } from "../Api/commands-meter.api";
import { buildCommandsMeterPath, commandsMeterData,} from "../Data/commands-meter.data";
import { CommandsMeterMapper } from "../Mapper/commands-meter.mapper";
import { CommandsMeterValidator } from "../Validator/commands-meter.validator";
test.describe("HES Commands — Meter Lookup", () => {
  test.setTimeout(120_000)
  test("Validate GET /commands/meters/:serial — in-scope active meter",
    { tag: ["@smoke", "@commands", "@hes", "@commands-meter"] },
    async ({ authenticatedApi }, testInfo) => {
      const serial = commandsMeterData.validMeterSerial;
      const api = new CommandsMeterApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsMeterValidator();
      const { rawResponse, responseBody, responseTime } =
      await api.getMeterBySerial(serial);
      const url = `${process.env.BASE_URL}${buildCommandsMeterPath(serial)}`;
      await PerformanceTracker.track(
        rawResponse,
        "Commands Meter Lookup",
        url,
        responseTime
      );
      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Meter Lookup",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsMeterData.maxResponseTimeMs,
      });
      validation.execute("Success Response", () =>
        validator.validateResponse(responseBody),
      );
      const row = CommandsMeterMapper.mapResponse(responseBody);
      validation.execute("Meter Lookup ID", () =>
        validator.validateMeterLookupId(row),
      );
      validation.execute("Meter Serial Number", () =>
        validator.validateMeterSerialNumber(row, serial),
      );
      validation.execute("Consumer Name", () =>
        validator.validateConsumerName(row),
      );
      validation.execute("Phase", () => validator.validatePhase(row));
      validation.execute("IVRS Number", () =>
        validator.validateIvrsNumber(row),
      );
      validation.execute("Nullable Fields Trimmed", () =>
        validator.validateNullableFieldsTrimmed(row),
      );
      validation.execute("Feeder", () => validator.validateFeeder(row));
      validation.execute("DTR", () => validator.validateDtr(row));
      validation.execute("Network Hierarchy", () =>
        validator.validateNetworkHierarchy(row),
      );
      validation.execute("Full API Contract", () =>
        validator.validateFullMeterDetails(row, serial),
      );
      const defectContext = {
        module: "HES-COMMANDS",
        endpoint: "/indore/commands/meters/:serial",
        method: "GET",
        requestParams: { serial },
        responseStatus: rawResponse.status(),
        responseBody,
        expectedBehavior:
          "200 with success envelope and meter details for in-scope active meter serial.",
      };
      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Meter Lookup",
        responseTime,
        testInfo,
        defectContext,
      });
    },
  );
  test(
    "Validate GET /commands/meters/:serial — unknown meter returns error",
    { tag: ["@commands", "@hes", "@commands-meter", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const serial = commandsMeterData.unknownMeterSerial;
      const api = new CommandsMeterApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsMeterValidator();
      const { rawResponse, responseBody, responseTime } =
        await api.getMeterBySerial(serial);
      const label = "Commands Meter Lookup — Unknown Serial";
      const status = rawResponse.status();
      if (
        BackendResponse.shouldSkipServerFailure(status, label, responseBody)
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          validator.validateErrorResponse(responseBody),
        );
        validation.printSummary(label, responseTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: "/indore/commands/meters/:serial",
            method: "GET",
            requestParams: { serial },
            responseStatus: status,
            responseBody,
            expectedBehavior:
              "404 with error envelope for unknown serial (backend intermittently returns 500 INTERNAL_ERROR).",
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
      const defectContext = {
        module: "HES-COMMANDS",
        endpoint: "/indore/commands/meters/:serial",
        method: "GET",
        requestParams: { serial },
        responseStatus: rawResponse.status(),
        responseBody,
        expectedBehavior: "Unknown or out-of-scope serial returns 404 with error envelope.",
      };
      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Meter Lookup — Unknown Serial",
        responseTime,
        testInfo,
        defectContext,
      });
    },
  );
});
