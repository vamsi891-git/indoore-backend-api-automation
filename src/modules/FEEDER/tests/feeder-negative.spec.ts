import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { FeederProfileApi } from "../Api/feederprofile.api";
import { FeederAlertsApi } from "../Api/feeder-alerts.api";
import { FeederDailyConsumptionApi } from "../Api/feeder-daily-consumption.api";
import { feederNegativeCases } from "../Data/feeder-negative.data";
import { feederAlertsData } from "../Data/feeder-alerts.data";
import { feederDailyConsumptionData } from "../Data/feeder-daily-consumption.data";
import { feederProfileData } from "../Data/feederprofile.data";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import {
  resolveFeederCode,
  skipIfFeederInternalError,
} from "../utils/feeder-env.helper";

test.describe("Feeder — mistakes that should be blocked", () => {
  for (const testCase of feederNegativeCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        const code =
          testCase.feederCode ??
          resolveFeederCode(
            testCase.kind === "alerts"
              ? feederAlertsData.feederCode
              : testCase.kind === "daily-consumption"
                ? feederDailyConsumptionData.feederCode
                : feederProfileData.feederCode,
          );
        const params = testCase.params ?? {};
        let status = 0;
        let body: unknown = {};
        if (testCase.kind === "profile") {
          const result = await new FeederProfileApi(
            authenticatedApi,
          ).getFeederProfile(code);
          status = result.rawResponse.status();
          body = result.responseBody;
          skipIfFeederInternalError(
            status,
            body,
            `/indore/feeder/${code}/profile`,
          );
        } else if (testCase.kind === "alerts") {
          const result = await new FeederAlertsApi(authenticatedApi).getAlerts(
            code,
            Number(params.page ?? feederAlertsData.page),
            Number(params.limit ?? feederAlertsData.limit),
          );
          status = result.rawResponse.status();
          body = result.responseBody;
          skipIfFeederInternalError(
            status,
            body,
            `/indore/feeder/${code}/alerts`,
          );
        } else {
          const result = await new FeederDailyConsumptionApi(
            authenticatedApi,
          ).getDailyConsumption(code, String(params.granularity) as "day");
          status = result.rawResponse.status();
          body = result.responseBody;
          skipIfFeederInternalError(
            status,
            body,
            `/indore/feeder/${code}/daily-consumption`,
          );
        }

        const validation = new ValidationEngine();
        validation.execute("Status", () => {
          expect(testCase.expectedStatuses).toContain(status);
        });
        validation.execute("Error envelope", () => {
          const parsed = body as {
            success?: boolean;
            error?: { code?: string };
          };
          expect(parsed.success).toBeFalsy();
          if (testCase.expectedCodes?.length) {
            expect(testCase.expectedCodes).toContain(parsed.error?.code);
          }
        });
        validation.printSummary(testCase.testName, 0);
      },
    );
  }
});
