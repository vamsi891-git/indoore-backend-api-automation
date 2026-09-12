import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { FeederProfileApi } from "../Api/feederprofile.api";
import { feederProfileData } from "../Data/feederprofile.data";
import { FeederProfileMapper } from "../Mapper/feederprofile.mapper";
import { FeederProfileValidator } from "../Validator/feederprofile.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { FeederProfileSuccessResponseSchema } from "../schemas/feeder.schemas";
import {
  resolveFeederCode,
  skipIfFeederInternalError,
} from "../utils/feeder-env.helper";

test.describe("Feeder profile", () => {
  test(
    "Feeder profile — name, status, parent DTR, and overview cards load",
    {
      tag: ["@feeder", "@profile", "@smoke"],
    },
    async ({ authenticatedApi }) => {
      const feederCode = resolveFeederCode(feederProfileData.feederCode);
      const api = new FeederProfileApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getFeederProfile(feederCode);
      await PerformanceTracker.track(
        rawResponse,
        "Feeder profile — name, status, parent DTR, and overview cards load",
        rawResponse.url(),
        responseTime,
      );
      skipIfFeederInternalError(
        rawResponse.status(),
        responseBody,
        `/indore/feeder/${feederCode}/profile`,
      );
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      validation.execute("Status Code", () =>
        assert.validateStatusCode(rawResponse, 200),
      );
      validation.execute("Content Type", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, 30000),
      );
      validation.execute("Sensitive Data", () =>
        assert.validateSensitiveData(responseBody),
      );
      if (rawResponse.status() === 200) {
        validation.execute("Zod Response Schema", () => {
          const result =
            FeederProfileSuccessResponseSchema.safeParse(responseBody);
          expect(
            result.success,
            result.success
              ? "Zod validation passed"
              : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
          ).toBe(true);
        });
      }
      const mapped = FeederProfileMapper.map(responseBody);
      const validator = new FeederProfileValidator();
      validation.execute("Success Flag Validation", () =>
        validator.validateSuccess(responseBody),
      );
      validation.execute("Response Data Validation", () =>
        validator.validateResponseData(responseBody),
      );
      validation.execute("Field Validation", () =>
        validator.validateFields(mapped),
      );
      validation.execute("Feeder Code Validation", () =>
        validator.validateFeederCode(mapped, feederCode),
      );
      validation.execute("Overview Count Validation", () =>
        validator.validateOverviewCount(mapped.overview),
      );
      validation.execute("Overview Structure Validation", () =>
        validator.validateOverviewStructure(mapped.overview),
      );
      validation.execute("Overview Order Validation", () =>
        validator.validateOverviewOrder(
          mapped.overview,
          feederProfileData.expectedOverviewTitles,
        ),
      );
      validation.execute("Type Validation", () =>
        validator.validateTypes(mapped),
      );
      validation.execute("Status Validation", () =>
        validator.validateStatus(mapped),
      );
      validation.execute("Parent DTR Validation", () =>
        validator.validateParentDtr(mapped),
      );
      validation.execute("Feeder Status Logic Validation", () =>
        validator.validateFeederStatusLogic(mapped),
      );
      validation.execute("DTR Number Logic Validation", () =>
        validator.validateDtrNumberLogic(mapped),
      );
      validation.execute("Capacity Logic Validation", () =>
        validator.validateCapacityLogic(mapped),
      );
      validation.execute("Unique Titles Validation", () =>
        validator.validateUniqueTitles(mapped.overview),
      );
      validation.execute("NaN Validation", () => validator.validateNaN(mapped));
      validation.printSummary(
        "Feeder profile — name, status, parent DTR, and overview cards load",
        responseTime,
      );
    },
  );
});
