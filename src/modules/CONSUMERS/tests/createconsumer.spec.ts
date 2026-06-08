import { expect } from "@playwright/test";
import { test } from "../../../../src/fixtures/api.fixture";
import { CreateConsumerApi } from "../Api/createconsumer.api";
import { ConsumerProfileApi } from "../Api/consumerprofile.api";
import { ValidateMeterApi } from "../Api/validatemeter.api";
import {
    buildCreateConsumerRequest,
    createConsumerData,
} from "../Data/createconsumer.data";
import { CreateConsumerMapper } from "../Mapper/createconsumer.mapper";
import { ValidateMeterMapper } from "../Mapper/validatemeter.mapper";
import { CreateConsumerValidator } from "../Validator/createconsumer.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";

test.describe("Create Consumer API", () => {
    test(
        "Validate Create Consumer API",
        {
            tag: ["@consumer", "@create-consumer", "@smoke"],
        },
        async ({ authenticatedApi }) => {
            const createApi = new CreateConsumerApi(authenticatedApi);
            const profileApi = new ConsumerProfileApi(authenticatedApi);
            const validateMeterApi = new ValidateMeterApi(authenticatedApi);
            const {
                maxResponseTime,
                expectedSuccessMessage,
                organisationLookupId,
                meterSerialNumber,
                profileQuery,
            } = createConsumerData;

            const requestBody = buildCreateConsumerRequest();
            const consumerCid = String(requestBody["Consumer ID"]);

            const meterCheck = await validateMeterApi.validateMeter(
                meterSerialNumber,
                organisationLookupId,
            );
            const meterMapped = ValidateMeterMapper.map(
                meterCheck.responseBody,
            );
            const meterIsAssignable = meterMapped.valid === true;

            const { rawResponse, responseBody, responseTime } =
                await createApi.createConsumer(requestBody);

            await PerformanceTracker.track(
                rawResponse,
                "Create Consumer API",
                `${process.env.BASE_URL}/indore/consumers`,
                responseTime,
            );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new CreateConsumerValidator();
            const mapped = CreateConsumerMapper.map(responseBody);

            const expectedStatus = meterIsAssignable
                ? [200, 201]
                : [400, 404, 409];
            validation.execute("Status", () => {
                const actual = rawResponse.status();
                expect(expectedStatus).toContain(actual);
            });
            validation.execute("Content Type", () =>
                assert.validateContentType(rawResponse),
            );
            validation.execute("Response Time", () =>
                assert.validateResponseTime(responseTime, maxResponseTime),
            );
            validation.execute("Sensitive Data", () =>
                assert.validateSensitiveData(responseBody),
            );

            if (meterIsAssignable) {
                validation.execute("Success Flag", () =>
                    validator.validateSuccessFlag(mapped.success),
                );
                validation.execute("Create Success", () =>
                    validator.validateCreateSuccess(mapped),
                );
                validation.execute("Success Message", () =>
                    validator.validateSuccessMessage(
                        mapped,
                        expectedSuccessMessage,
                    ),
                );
                validation.execute("Root Structure", () =>
                    validator.validateRootStructure(mapped),
                );
                validation.execute("Required Response Fields", () =>
                    validator.validateRequiredResponseFields(mapped.data!),
                );
                validation.execute("String Fields", () =>
                    validator.validateStringFields(mapped.data!),
                );
                validation.execute("Optional String Fields", () =>
                    validator.validateOptionalStringFields(mapped.data!),
                );
                validation.execute("Numeric Fields", () =>
                    validator.validateNumericFields(mapped.data!),
                );
                validation.execute("Boolean Fields", () =>
                    validator.validateBooleanFields(mapped.data!),
                );
                validation.execute("Lookup Display Fields", () =>
                    validator.validateLookupDisplayFields(mapped.data!),
                );
                validation.execute("Formats", () =>
                    validator.validateFormats(mapped.data!),
                );
                validation.execute("Non Negative Loads", () =>
                    validator.validateNonNegativeLoads(mapped.data!),
                );
                validation.execute("Bill Day", () =>
                    validator.validateBillDay(mapped.data!),
                );
                validation.execute("Request Echo", () =>
                    validator.validateRequestEcho(mapped.data!, requestBody),
                );
                validation.execute("Lookup Echo", () =>
                    validator.validateLookupEcho(mapped.data!, requestBody),
                );
                validation.execute("Business Rules", () =>
                    validator.validateBusinessRules(mapped.data!),
                );
                validation.execute("Data Present Backend Rules", () =>
                    validator.validateDataPresentBackendRules(
                        mapped,
                        requestBody,
                        expectedSuccessMessage,
                    ),
                );

                const profileResult = await profileApi.getConsumerProfile(
                    consumerCid,
                    profileQuery,
                );

                validation.execute("Post Create Profile Status", () =>
                    assert.validateStatusCode(
                        profileResult.rawResponse,
                        200,
                        profileResult.responseBody,
                    ),
                );
                validation.execute("Post Create Profile Exists", () =>
                    validator.validatePostCreateProfileExists(
                        profileResult.responseBody,
                    ),
                );
                validation.execute("Post Create Profile Persistence", () =>
                    validator.validatePostCreateProfilePersistence(
                        profileResult.responseBody,
                        requestBody,
                    ),
                );
                validation.execute("Post Create Profile Backend Rules", () =>
                    validator.validatePostCreateProfileBackendRules(
                        profileResult.responseBody,
                        requestBody,
                    ),
                );

                if (mapped.isCreateSuccess) {
                    console.log(
                        "\n==================================================",
                    );
                    console.log("CONSUMER CREATED SUCCESSFULLY");
                    console.log(
                        "==================================================",
                    );
                    console.log("Consumer ID:", consumerCid);
                    console.log("IVRS Number:", requestBody["IVRS Number"]);
                    console.log("Account ID:", requestBody["Account ID"]);
                    console.log("MSN:", requestBody["MSN"]);
                    console.log("\n--- Create API Response ---");
                    console.log(JSON.stringify(responseBody, null, 2));
                    console.log("\n--- Profile API Response ---");
                    console.log(
                        JSON.stringify(profileResult.responseBody, null, 2),
                    );
                    console.log(
                        "==================================================\n",
                    );
                }
            } else {
                validation.execute("Error Structure", () =>
                    validator.validateErrorStructure(mapped),
                );
                validation.execute("Known Error Code", () =>
                    validator.validateKnownErrorCode(mapped),
                );
                validation.execute("Meter Conflict", () =>
                    validator.validateMeterConflict(mapped),
                );
                validation.execute("Meter Not Found", () =>
                    validator.validateMeterNotFound(mapped),
                );
                validation.execute("Duplicate Consumer", () =>
                    validator.validateDuplicateConsumer(mapped),
                );
                validation.execute("Validation Error", () =>
                    validator.validateValidationError(mapped),
                );
                validation.execute("Not Duplicate ID Conflict", () =>
                    validator.validateConflictNotFromUniqueConsumerIds(
                        mapped,
                        requestBody,
                    ),
                );
                validation.execute("Expected Meter Error", () =>
                    validator.validateExpectedErrorForMeterReason(
                        mapped,
                        meterMapped.reason,
                    ),
                );
                validation.execute("Conflict Backend Rules", () =>
                    validator.validateConflictBackendRules(
                        mapped,
                        meterMapped.reason,
                        requestBody,
                    ),
                );

                const profileResult = await profileApi.getConsumerProfile(
                    consumerCid,
                    profileQuery,
                );

                validation.execute("Post Create Profile Not Found Status", () =>
                    assert.validateStatusCode(
                        profileResult.rawResponse,
                        404,
                        profileResult.responseBody,
                    ),
                );
                validation.execute("Consumer Not Persisted", () =>
                    validator.validatePostCreateConsumerNotFound(
                        profileResult.responseBody,
                    ),
                );

                const allMetersOccupied =
                    meterMapped.reason === "METER_NOT_FOUND" ||
                    mapped.error?.code === "METER_NOT_FOUND" ||
                    meterMapped.reason === "METER_ALREADY_ASSIGNED" ||
                    mapped.error?.code === "METER_ALREADY_ASSIGNED";

                console.log(
                    "\n==================================================",
                );
                console.log(
                    allMetersOccupied
                        ? "All meters are occupied."
                        : "CONSUMER NOT CREATED",
                );
                console.log(
                    "==================================================",
                );
                console.log("Consumer ID (attempted):", consumerCid);
                console.log("IVRS Number (attempted):", requestBody["IVRS Number"]);
                console.log("MSN:", requestBody["MSN"]);
                console.log("Validate-meter reason:", meterMapped.reason);
                console.log("HTTP status:", rawResponse.status());
                console.log("\n--- Create API Response ---");
                console.log(JSON.stringify(responseBody, null, 2));
                console.log("\n--- Profile API Response (should be 404) ---");
                console.log(
                    JSON.stringify(profileResult.responseBody, null, 2),
                );
                console.log(
                    "==================================================\n",
                );
            }

            validation.printSummary("Create Consumer API", responseTime);
        },
    );
});
