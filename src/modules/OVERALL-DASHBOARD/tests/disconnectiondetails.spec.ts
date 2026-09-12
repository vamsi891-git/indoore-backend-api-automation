import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { DisconnectionDetailsApi } from "../Api/disconnectiondetails.api";
import {
  DISCONNECTION_DETAILS_PATH,
  disconnectionDetailsData,
} from "../Data/disconnectiondetails.data";
import { DisconnectionDetailsMapper } from "../Mapper/disconnectiondetails.mapper";
import { DisconnectionDetailsValidator } from "../Validator/disconnectiondetails.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DisconnectionDetailsSuccessResponseSchema } from "../schemas/overall-dashboard.schemas";
import { skipIfOverallDashboardInternalError } from "../utils/overall-dashboard-env.helper";

test.describe("Connect and disconnect by month", () => {
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test(
    "Connect and disconnect by month — last six months, each month listed once",
    {
      tag: [
        "@smoke",
        "@overall-dashboard",
        "@disconnection-details",
        "@positive",
      ],
    },
    async ({ authenticatedApi }) => {
      const api = new DisconnectionDetailsApi(authenticatedApi);
      const { maxResponseTime } = disconnectionDetailsData;
      const { rawResponse, responseBody, responseTime } =
        await api.getDisconnectionDetails();
      await PerformanceTracker.track(
        rawResponse,
        "Connect and disconnect by month — last six months, each month listed once",
        rawResponse.url(),
        responseTime,
      );
      skipIfOverallDashboardInternalError(
        rawResponse.status(),
        responseBody,
        DISCONNECTION_DETAILS_PATH,
      );
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new DisconnectionDetailsValidator();
      validation.execute("Status", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      validation.execute("Content Type", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, maxResponseTime),
      );
      validation.execute("Sensitive Data", () =>
        assert.validateSensitiveData(responseBody),
      );
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success"]),
      );
      const mapped = DisconnectionDetailsMapper.map(responseBody);
      if (rawResponse.status() === 200) {
        validation.execute("Data Present When 200", () =>
          assert.validateRequiredFields(responseBody, ["data"]),
        );
        validation.execute("Zod Response Schema", () => {
          const result =
            DisconnectionDetailsSuccessResponseSchema.safeParse(responseBody);
          expect(
            result.success,
            result.success
              ? "Zod validation passed"
              : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
          ).toBe(true);
        });
        validation.execute("Success", () =>
          validator.validateSuccess(mapped.success),
        );
        validation.execute("Six unique months", () =>
          validator.validateMonthSeries(mapped),
        );
      }
      validation.printSummary(
        "Connect and disconnect by month — last six months, each month listed once",
        responseTime,
      );
    },
  );

  test(
    "Connect and disconnect by month — leftover extra filters are blocked",
    {
      tag: [
        "@overall-dashboard",
        "@disconnection-details",
        "@negative",
        "@edge",
      ],
    },
    async ({ authenticatedApi }) => {
      const api = new DisconnectionDetailsApi(authenticatedApi);
      const { rawResponse, responseBody } = await api.getDisconnectionDetails({
        foo: "bar",
      });
      skipIfOverallDashboardInternalError(
        rawResponse.status(),
        responseBody,
        DISCONNECTION_DETAILS_PATH,
      );
      const validation = new ValidationEngine();
      validation.execute("Status 400", () => {
        expect(rawResponse.status()).toBe(400);
      });
      validation.execute("Validation error", () => {
        const body = responseBody as {
          success?: boolean;
          error?: { code?: string; message?: string };
        };
        expect(body.success).toBeFalsy();
        expect(body.error?.code).toBe("VALIDATION_ERROR");
        expect(String(body.error?.message ?? "").toLowerCase()).toMatch(
          /unrecognized|unknown|invalid/,
        );
      });
      validation.printSummary(
        "Connect and disconnect by month — leftover extra filters are blocked",
        0,
      );
    },
  );
});
