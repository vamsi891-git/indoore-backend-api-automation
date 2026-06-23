import { test } from "../../../../src/fixtures/api.fixture";
import { ValidateMeterApi } from "../Api/validatemeter.api";
import { validateMeterData } from "../Data/validatemeter.data";
import { ValidateMeterMapper } from "../Mapper/validatemeter.mapper";
import { ValidateMeterValidator } from "../Validator/validatemeter.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";

test.describe("Validate Meter API", () => {
    test(
        "Validate Meter API",
        {
            tag: ["@consumer", "@validate-meter", "@smoke"],
        },
        async ({ authenticatedApi }) => {
            const api = new ValidateMeterApi(authenticatedApi);
            const {
                meterSerialNumber,
                organisationLookupId,
                maxResponseTime,
                expectedValid,
                expectedReason,
            } = validateMeterData;

            const { rawResponse, responseBody, responseTime } =
                await api.validateMeter(
                    meterSerialNumber,
                    organisationLookupId,
                );

            await PerformanceTracker.track(
                rawResponse,
                "Validate Meter API",
                `${process.env.BASE_URL}/indore/consumers/validate-meter?meterSerialNumber=${meterSerialNumber}&organisationLookupId=${organisationLookupId}`,
                responseTime,
            );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new ValidateMeterValidator();

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
                assert.validateRequiredFields(responseBody, ["success", "data"]),
            );

            const mapped = ValidateMeterMapper.map(responseBody);

            validation.execute("Success", () =>
                validator.validateSuccess(mapped.success),
            );
            validation.execute("Root Structure", () =>
                validator.validateRootStructure(mapped),
            );
            validation.execute("Data Required Fields", () =>
                validator.validateDataRequiredFields(mapped),
            );
            validation.execute("Valid Flag Type", () =>
                validator.validateValidFlagType(mapped),
            );
            validation.execute("Reason Type", () =>
                validator.validateReasonType(mapped),
            );
            validation.execute("Valid Reason Consistency", () =>
                validator.validateValidReasonConsistency(mapped),
            );
            validation.execute("Invalid Scenario", () =>
                validator.validateInvalidScenario(mapped),
            );
            validation.execute("Valid Scenario", () =>
                validator.validateValidScenario(mapped),
            );
            validation.execute("Reason Allowed Values", () =>
                validator.validateReasonAllowedValues(mapped),
            );
            validation.execute("Meter Details When Valid", () =>
                validator.validateMeterDetailsWhenValid(
                    mapped,
                    meterSerialNumber,
                    organisationLookupId,
                ),
            );
            validation.execute("Meter Details By Invalid Reason", () =>
                validator.validateMeterDetailsByInvalidReason(
                    mapped,
                    meterSerialNumber,
                    organisationLookupId,
                ),
            );
            validation.execute("Expected Outcome", () =>
                validator.validateExpectedOutcome(
                    mapped,
                    expectedValid,
                    expectedReason,
                ),
            );
            validation.execute("Business Rules", () =>
                validator.validateBusinessRules(mapped),
            );
            validation.execute("Data Present Backend Rules", () =>
                validator.validateDataPresentBackendRules(
                    mapped,
                    meterSerialNumber,
                    organisationLookupId,
                    expectedValid,
                    expectedReason,
                ),
            );

            validation.printSummary("Validate Meter API", responseTime);
        },
    );
});
