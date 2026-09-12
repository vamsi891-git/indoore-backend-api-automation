import { test as authTest } from "../../../fixtures/auth.fixture";
import { expect } from "@playwright/test";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { INSTALLATION_SUMMARY_PATH } from "../Data/installationsummary.data";
import { DISCONNECTION_DETAILS_PATH } from "../Data/disconnectiondetails.data";
import {
  dtrUnbalanceAccessTokenInvalidCode,
  dtrUnbalanceAccessTokenInvalidMessage,
  dtrUnbalanceAuthNegativeCases,
  dtrUnbalanceUnauthorizedCode,
  dtrUnbalanceUnauthorizedMessage,
} from "../../DASHBOARD/Data/dtr-unbalance-auth.data";

const overallDashboardAuthPaths = [
  {
    path: INSTALLATION_SUMMARY_PATH,
    tag: "@installation-summary",
    label: "Mapped vs unmapped meters",
  },
  {
    path: DISCONNECTION_DETAILS_PATH,
    tag: "@disconnection-details",
    label: "Connect and disconnect by month",
  },
] as const;

authTest.describe("Home dashboard screens — cannot open without a valid login", () => {
  authTest.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const target of overallDashboardAuthPaths) {
    for (const authCase of dtrUnbalanceAuthNegativeCases) {
      authTest(
        `${target.label} — ${authCase.testName}`,
        { tag: [...authCase.tags, "@overall-dashboard", target.tag] },
        async ({ unauthenticatedApi }) => {
          const assert = new AssertionEngine();
          const validation = new ValidationEngine();
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
            authTest.skip(
              true,
              `Rate limited (429) on ${target.path} — retry later`,
            );
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
            assert.validateStatusCode(
              rawResponse,
              authCase.expectedStatus,
              responseBody,
            ),
          );
          validation.execute("Content Type", () =>
            assert.validateContentType(rawResponse),
          );
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

          validation.printSummary(
            `${target.label} — ${authCase.expectedErrorCode}`,
            responseTime,
          );
        },
      );
    }
  }
});
