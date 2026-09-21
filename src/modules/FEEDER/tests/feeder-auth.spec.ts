import { test as authTest } from "../../../fixtures/auth.fixture";
import { expect } from "@playwright/test";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { resolveFeederCode } from "../utils/feeder-env.helper";
import { feederProfileData } from "../Data/feederprofile.data";
import {
  dtrUnbalanceAccessTokenInvalidCode,
  dtrUnbalanceAccessTokenInvalidMessage,
  dtrUnbalanceAuthNegativeCases,
  dtrUnbalanceUnauthorizedCode,
  dtrUnbalanceUnauthorizedMessage,
} from "../../DASHBOARD/Data/dtr-unbalance-auth.data";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

authTest.describe("Feeder screens — cannot open without a valid login", () => {
  authTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  const code = resolveFeederCode(feederProfileData.feederCode);
  const feederAuthPaths = [
    {
      path: `/indore/feeder/${code}/profile`,
      tag: "@profile",
      label: "Feeder profile",
    },
    {
      path: `/indore/feeder/${code}/alerts?page=1&limit=20`,
      tag: "@feeder-alerts",
      label: "Feeder alerts",
    },
    {
      path: `/indore/feeder/${code}/electrical-parameters`,
      tag: "@electrical-parameters",
      label: "Feeder voltage and current",
    },
    {
      path: `/indore/feeder/${code}/daily-consumption?granularity=day`,
      tag: "@daily-consumption",
      label: "Feeder daily energy",
    },
  ] as const;

  for (const target of feederAuthPaths) {
    for (const authCase of dtrUnbalanceAuthNegativeCases) {
      authTest(
        `${target.label} — ${authCase.testName}`,
        { tag: [...authCase.tags, "@feeder", target.tag] },
        async ({ unauthenticatedApi }) => {
          const assert = new ApiValidationHelper();
          const validation = new ApiValidationHelper();
          const started = Date.now();

          const rawResponse = await unauthenticatedApi.get(target.path, {
            headers: authCase.headers,
          });
          if (
            BackendResponse.shouldSkipRateLimit(
              rawResponse.status(),
              `${target.label} ${authCase.testName}`,
            )
          ) {
            authTest.skip(true, `Rate limited (429) on ${target.path} — retry later`);
            return;
          }
          const responseBody = await rawResponse.json().catch(() => ({}));
          const responseTime = Date.now() - started;

          await PerformanceTracker.track(
            rawResponse,
            `${target.label} ${authCase.expectedErrorCode}`,
            rawResponse.url(),
            responseTime,
          );

          validation.execute("Status (auth negative)", () =>
            assert.validateStatusCode(rawResponse, authCase.expectedStatus, responseBody),
          );
          validation.execute("Content Type", () => assert.validateContentType(rawResponse));
          validation.execute("Auth Error Envelope", () => {
            const body = responseBody as {
              success?: boolean;
              error?: { code?: string; message?: string };
            };
            expect(body.success).toBeFalsy();
            expect(body.error?.code).toBe(authCase.expectedErrorCode);
            const expectedMessage =
              authCase.expectedErrorCode === dtrUnbalanceAccessTokenInvalidCode
                ? dtrUnbalanceAccessTokenInvalidMessage
                : authCase.expectedErrorCode === dtrUnbalanceUnauthorizedCode
                  ? dtrUnbalanceUnauthorizedMessage
                  : authCase.expectedMessage;
            expect(String(body.error?.message ?? "").toLowerCase()).toContain(
              expectedMessage.toLowerCase(),
            );
          });

          validation.printSummary(`${target.label} — ${authCase.expectedErrorCode}`, responseTime);
        },
      );
    }
  }
});
