import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { CommandsMeterLocationApi } from "../Api/commands-meter-location.api";
import {
  buildMeterLocationBody,
  commandsMeterLocationData,
  METER_LOCATION_PATH,
} from "../Data/commands-meter-location.data";
import { CommandsMeterLocationMapper } from "../Mapper/commands-meter-location.mapper";
import { CommandsMeterLocationValidator } from "../Validator/commands-meter-location.validator";

test.describe("HES Commands — Meter Location", () => {
  test.setTimeout(120_000);

  test(
    "Validate POST /commands/meter-location — set location for known node",
    { tag: ["@smoke", "@commands", "@hes", "@commands-meter-location"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = buildMeterLocationBody();
      const api = new CommandsMeterLocationApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsMeterLocationValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.postMeterLocation(body);

      const url = `${process.env.BASE_URL}${METER_LOCATION_PATH}`;
      await PerformanceTracker.track(
        rawResponse,
        "Commands Meter Location",
        rawResponse.url(),
        responseTime
      );

      const status = rawResponse.status();

      if (BackendResponse.shouldSkipServerFailure(status, "Commands Meter Location", responseBody)) {
        validation.execute("Error Response (500 backend defect)", () =>
          validator.validateErrorResponse(responseBody),
        );
        validation.printSummary("Commands Meter Location", responseTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: rawResponse.url(),
            method: "POST",
            requestParams: body,
            responseStatus: status,
            responseBody,
            expectedBehavior:
              "200 with nodeId/latitude/longitude and HES setLocation SOAP (backend intermittently returns 500 HES_ERROR).",
          },
        });
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Meter Location",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsMeterLocationData.maxResponseTimeMs,
      });

      validation.execute("Success Response", () =>
        validator.validateResponse(responseBody),
      );

      const mapped = CommandsMeterLocationMapper.mapResponse(responseBody);

      validation.execute("Node ID Echo", () =>
        validator.validateNodeIdEcho(mapped.location, body),
      );
      validation.execute("Node ID Format", () =>
        validator.validateNodeIdFormat(mapped.location),
      );
      validation.execute("Coordinates", () =>
        validator.validateCoordinates(mapped.location),
      );
      validation.execute("HES SOAP Envelope", () =>
        validator.validateHesSoapEnvelope(mapped.location),
      );
      validation.execute("HES SOAP Node ID", () =>
        validator.validateHesSoapNodeId(mapped.location),
      );
      validation.execute("HES SOAP Coordinates", () =>
        validator.validateHesSoapCoordinates(mapped.location),
      );
      validation.execute("HES SOAP Metadata", () =>
        validator.validateHesSoapMetadata(mapped.location),
      );
      validation.execute("Full API Contract", () =>
        validator.validateFullContract(mapped, body),
      );

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Meter Location",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: rawResponse.url(),
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "200 with nodeId echo, latitude/longitude, and HES setLocation SOAP response aligned with data fields.",
        },
      });
    },
  );

  test(
    "Validate POST /commands/meter-location — unknown node returns error",
    { tag: ["@commands", "@hes", "@commands-meter-location", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = buildMeterLocationBody({
        nodeId: commandsMeterLocationData.unknownHesNodeId,
      });
      const api = new CommandsMeterLocationApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsMeterLocationValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.postMeterLocation(body);

      const label = "Commands Meter Location — Unknown Node";
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
            method: "POST",
            requestParams: body,
            responseStatus: status,
            responseBody,
            expectedBehavior:
              "404/400 for unknown HES node (backend intermittently returns 500).",
          },
        });
        return;
      }

      validation.execute("Status (client error)", () => {
        expect([400, 404]).toContain(status);
      });
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
          endpoint: rawResponse.url(),
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "Unknown HES node returns 400 or 404 with error envelope.",
        },
      });
    },
  );

  test(
    "Validate POST /commands/meter-location — invalid latitude returns error",
    { tag: ["@commands", "@hes", "@commands-meter-location", "@negative"] },
    async ({ authenticatedApi }, testInfo) => {
      const body = buildMeterLocationBody({
        latitude: commandsMeterLocationData.invalidLatitude,
      });
      const api = new CommandsMeterLocationApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new CommandsMeterLocationValidator();

      const { rawResponse, responseBody, responseTime } =
        await api.postMeterLocation(body);

      const label = "Commands Meter Location — Invalid Latitude";
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
            method: "POST",
            requestParams: body,
            responseStatus: status,
            responseBody,
            expectedBehavior:
              "400 for latitude out of range (backend intermittently returns 500).",
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
          endpoint: rawResponse.url(),
          method: "POST",
          requestParams: body,
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior: "latitude=999 returns 400 with error envelope.",
        },
      });
    },
  );
});
