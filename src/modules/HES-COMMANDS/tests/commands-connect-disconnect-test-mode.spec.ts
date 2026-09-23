import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { CommandsConnectDisconnectTestModeApi } from "../Api/commands-connect-disconnect-test-mode.api";
import {
  CONNECT_DISCONNECT_TEST_MODE_PATH,
  commandsConnectDisconnectTestModeData,
} from "../Data/commands-connect-disconnect-test-mode.data";
import { CommandsConnectDisconnectTestModeMapper } from "../Mapper/commands-connect-disconnect-test-mode.mapper";
import { CommandsConnectDisconnectTestModeValidator } from "../Validator/commands-connect-disconnect-test-mode.validator";

test.describe("HES Commands — Connect/Disconnect Test Mode Setting", () => {
  test.setTimeout(120_000);

  test(
    "Validate GET /commands/settings/connect-disconnect-test-mode",
    {
      tag: [
        "@smoke",
        "@commands",
        "@hes",
        "@commands-settings",
        "@commands-connect-disconnect-test-mode",
      ],
    },
    async ({ authenticatedApi }, testInfo) => {
      const api = new CommandsConnectDisconnectTestModeApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new CommandsConnectDisconnectTestModeValidator();

      const { rawResponse, responseBody, responseTime } = await api.getTestMode();

      await PerformanceTracker.track(
        rawResponse,
        "Commands Connect-Disconnect Test Mode",
        rawResponse.url(),
        responseTime,
      );

      if (
        BackendResponse.shouldSkipServerFailure(
          rawResponse.status(),
          "Commands Connect-Disconnect Test Mode",
          responseBody,
        )
      ) {
        validation.execute("Error Response (500 backend defect)", () =>
          validator.validateErrorResponse(responseBody),
        );
        validation.printSummary("Commands Connect-Disconnect Test Mode", responseTime, {
          testInfo,
          defectContext: {
            module: "HES-COMMANDS",
            endpoint: rawResponse.url(),
            method: "GET",
            requestParams: {},
            responseStatus: rawResponse.status(),
            responseBody,
            expectedBehavior:
              "200 with enabled, settingKey, canUpdate for connect_disconnect_test_mode.",
          },
        });
        return;
      }

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Commands Connect-Disconnect Test Mode",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: commandsConnectDisconnectTestModeData.maxResponseTimeMs,
      });

      validation.execute("Success Response", () => validator.validateResponse(responseBody));
      expect(responseBody.data).toBeDefined();
      const rawData = responseBody.data!;
      const mapped = CommandsConnectDisconnectTestModeMapper.mapResponse(responseBody);

      console.log(
        `\n[Connect-Disconnect Test Mode] enabled=${mapped.enabled} ` +
          `canUpdate=${mapped.canUpdate} key=${mapped.settingKey}\n`,
      );

      validation.execute("Data Keys", () => validator.validateDataKeys(rawData));
      validation.execute("Setting Key", () => validator.validateSettingKey(mapped));
      validation.execute("Flags", () => validator.validateFlags(mapped));
      validation.execute("Full Contract", () => validator.validateFullContract(mapped, rawData));

      ApiValidationHelper.finalize(validation, {
        apiName: "Commands Connect-Disconnect Test Mode",
        responseTime,
        testInfo,
        defectContext: {
          module: "HES-COMMANDS",
          endpoint: CONNECT_DISCONNECT_TEST_MODE_PATH,
          method: "GET",
          requestParams: {},
          responseStatus: rawResponse.status(),
          responseBody,
          expectedBehavior:
            "200 with settingKey=connect_disconnect_test_mode and boolean enabled/canUpdate.",
        },
      });
    },
  );
});
