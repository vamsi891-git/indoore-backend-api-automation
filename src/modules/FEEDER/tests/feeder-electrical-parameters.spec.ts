import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { FeederElectricalParametersApi } from "../Api/feeder-electrical-parameters.api";
import { feederElectricalParametersData } from "../Data/feeder-electrical-parameters.data";
import { FeederElectricalParametersMapper } from "../Mapper/feeder-electrical-parameters.mapper";
import { FeederElectricalParametersValidator } from "../Validator/feeder-electrical-parameters.validator";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { FeederElectricalParametersSuccessResponseSchema } from "../schemas/feeder.schemas";
import { resolveFeederCode, skipIfFeederInternalError } from "../utils/feeder-env.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Feeder voltage and current", () => {
  test(
    "Feeder voltage and current — red, yellow, and blue phases (blank is OK if no meter)",
    {
      tag: ["@feeder", "@electrical-parameters", "@smoke"],
    },
    async ({ authenticatedApi }) => {
      const feederCode = resolveFeederCode(feederElectricalParametersData.feederCode);
      const api = new FeederElectricalParametersApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getElectricalParameters(feederCode);
      await PerformanceTracker.track(
        rawResponse,
        "Feeder voltage and current — red, yellow, and blue phases (blank is OK if no meter)",
        rawResponse.url(),
        responseTime,
      );
      skipIfFeederInternalError(
        rawResponse.status(),
        responseBody,
        `/indore/feeder/${feederCode}/electrical-parameters`,
      );
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      validation.execute("Status Code", () => assert.validateStatusCode(rawResponse, 200));
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () => assert.validateResponseTime(responseTime, 30000));
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));
      if (rawResponse.status() === 200) {
        validation.execute("Zod Response Schema", () => {
          const result = FeederElectricalParametersSuccessResponseSchema.safeParse(responseBody);
          expect(
            result.success,
            result.success
              ? "Zod validation passed"
              : `Zod contract mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
          ).toBe(true);
        });
      }
      const mapped = FeederElectricalParametersMapper.map(responseBody);
      const validator = new FeederElectricalParametersValidator();
      validation.execute("Field Validation", () => validator.validateFields(mapped));
      validation.execute("R Phase Structure Validation", () =>
        validator.validatePhaseStructure(mapped.rPhase),
      );
      validation.execute("R Phase Unit Validation", () =>
        validator.validateUnits(
          mapped.rPhase,
          feederElectricalParametersData.expectedVoltageUnit,
          feederElectricalParametersData.expectedCurrentUnit,
        ),
      );
      validation.execute("R Phase Type Validation", () => validator.validateTypes(mapped.rPhase));
      validation.execute("R Phase Value Validation", () =>
        validator.validatePositiveValues(mapped.rPhase),
      );
      validation.execute("R Phase NaN Validation", () => validator.validateNaN(mapped.rPhase));
      validation.execute("Y Phase Structure Validation", () =>
        validator.validatePhaseStructure(mapped.yPhase),
      );
      validation.execute("Y Phase Unit Validation", () =>
        validator.validateUnits(
          mapped.yPhase,
          feederElectricalParametersData.expectedVoltageUnit,
          feederElectricalParametersData.expectedCurrentUnit,
        ),
      );
      validation.execute("Y Phase Type Validation", () => validator.validateTypes(mapped.yPhase));
      validation.execute("Y Phase Value Validation", () =>
        validator.validatePositiveValues(mapped.yPhase),
      );
      validation.execute("Y Phase NaN Validation", () => validator.validateNaN(mapped.yPhase));
      validation.execute("B Phase Structure Validation", () =>
        validator.validatePhaseStructure(mapped.bPhase),
      );
      validation.execute("B Phase Unit Validation", () =>
        validator.validateUnits(
          mapped.bPhase,
          feederElectricalParametersData.expectedVoltageUnit,
          feederElectricalParametersData.expectedCurrentUnit,
        ),
      );
      validation.execute("B Phase Type Validation", () => validator.validateTypes(mapped.bPhase));
      validation.execute("B Phase Value Validation", () =>
        validator.validatePositiveValues(mapped.bPhase),
      );
      validation.execute("B Phase NaN Validation", () => validator.validateNaN(mapped.bPhase));
      validation.execute("Last Communication Validation", () =>
        validator.validateLastCommunication(mapped.lastCommunication),
      );
      validation.execute("Empty Meter Logic Validation", () =>
        validator.validateEmptyMeterLogic(mapped),
      );
      validation.printSummary(
        "Feeder voltage and current — red, yellow, and blue phases (blank is OK if no meter)",
        responseTime,
      );
    },
  );
});
