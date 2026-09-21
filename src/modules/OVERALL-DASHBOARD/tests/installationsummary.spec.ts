import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { InstallationSummaryApi } from "../Api/installationsummary.api";
import {
  INSTALLATION_SUMMARY_PATH,
  installationSummaryData,
} from "../Data/installationsummary.data";
import { InstallationSummaryMapper } from "../Mapper/installationsummary.mapper";
import { InstallationSummaryValidator } from "../Validator/installationsummary.validator";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { InstallationSummarySuccessResponseSchema } from "../schemas/overall-dashboard.schemas";
import { skipIfOverallDashboardInternalError } from "../utils/overall-dashboard-env.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Mapped vs unmapped meters", () => {
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test(
    "Mapped vs unmapped meters — the two counts add up to the full fleet",
    {
      tag: ["@smoke", "@overall-dashboard", "@installation-summary", "@positive"],
    },
    async ({ authenticatedApi }) => {
      const api = new InstallationSummaryApi(authenticatedApi);
      const { maxResponseTime } = installationSummaryData;
      const { rawResponse, responseBody, responseTime } = await api.getInstallationSummary();
      await PerformanceTracker.track(
        rawResponse,
        "Mapped vs unmapped meters — the two counts add up to the full fleet",
        rawResponse.url(),
        responseTime,
      );
      skipIfOverallDashboardInternalError(
        rawResponse.status(),
        responseBody,
        INSTALLATION_SUMMARY_PATH,
      );
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new InstallationSummaryValidator();
      validation.execute("Status", () => assert.validateStatusCode(rawResponse, 200, responseBody));
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, maxResponseTime),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));
      validation.execute("Required Fields", () =>
        assert.validateRequiredFields(responseBody, ["success"]),
      );
      const mapped = InstallationSummaryMapper.map(responseBody);
      if (rawResponse.status() === 200) {
        validation.execute("Data Present When 200", () =>
          assert.validateRequiredFields(responseBody, ["data"]),
        );
        validation.execute("Zod Response Schema", () => {
          const result = InstallationSummarySuccessResponseSchema.safeParse(responseBody);
          expect(
            result.success,
            result.success
              ? "Zod validation passed"
              : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
          ).toBe(true);
        });
        validation.execute("Success", () => validator.validateSuccess(mapped.success));
        validation.execute("Mapped + unmapped = total", () => validator.validateCounts(mapped));
        validation.execute("Bucket titles", () => validator.validateTitles(mapped));
        validation.execute("Share percents", () => validator.validateSharePercents(mapped));
      }
      validation.printSummary(
        "Mapped vs unmapped meters — the two counts add up to the full fleet",
        responseTime,
      );
    },
  );

  test(
    "Mapped vs unmapped meters — leftover extra filters are blocked",
    {
      tag: ["@overall-dashboard", "@installation-summary", "@negative", "@edge"],
    },
    async ({ authenticatedApi }) => {
      const api = new InstallationSummaryApi(authenticatedApi);
      const { rawResponse, responseBody } = await api.getInstallationSummary({
        foo: "bar",
      });
      skipIfOverallDashboardInternalError(
        rawResponse.status(),
        responseBody,
        INSTALLATION_SUMMARY_PATH,
      );
      const validation = new ApiValidationHelper();
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
      validation.printSummary("Mapped vs unmapped meters — leftover extra filters are blocked", 0);
    },
  );
});
