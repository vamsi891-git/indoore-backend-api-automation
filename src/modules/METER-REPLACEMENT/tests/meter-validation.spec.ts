import { test } from "../../../fixtures/api.fixture";
import { MeterValidationApi } from "../Api/meter-validation.api";
import { meterValidationData } from "../Data/meter-validation.data";
import { MeterValidationMapper } from "../Mapper/meter-validation.mapper";
import { MeterValidationValidator } from "../Validator/meter-validation.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Meter Replacement Meter Validation API", () => {

    test(
        "Validate Meter Replacement Meter Validation API",
        {
            tag: [
                "@meter-replacement",
                "@meter-validation",
                "@smoke",
            ],
        },

        async ({ authenticatedApi }) => {

            const api = new MeterValidationApi(
                authenticatedApi,
            );

            const {
                validMeterSerial,
                maxResponseTime,
            } = meterValidationData;

            const {
                rawResponse,
                responseBody,
                responseTime,
            } = await api.validateMeter(
                validMeterSerial,
            );

            await PerformanceTracker.track(
                rawResponse,
                "Meter Replacement Meter Validation API",
                rawResponse.url(),
                responseTime,
            );

            const assert =
                new AssertionEngine();

            const validation =
                new ValidationEngine();

            const validator =
                new MeterValidationValidator();

            //--------------------------------------------------
            // Assertion Engine
            //--------------------------------------------------

            validation.execute("Status Code", () =>
                assert.validateStatusCode(
                    rawResponse,
                    200,
                    responseBody,
                ),
            );

            validation.execute("Content Type", () =>
                assert.validateContentType(
                    rawResponse,
                ),
            );

            validation.execute("Response Time", () =>
                assert.validateResponseTime(
                    responseTime,
                    maxResponseTime,
                ),
            );

            validation.execute("Sensitive Data", () =>
                assert.validateSensitiveData(
                    responseBody,
                ),
            );

            validation.execute("Required Root Fields", () =>
                assert.validateRequiredFields(
                    responseBody,
                    [
                        "success",
                        "data",
                    ],
                ),
            );

            validation.execute("Required Data Fields", () =>
                assert.validateRequiredFields(
                    responseBody.data,
                    [
                        "valid",
                        "message",
                        "meterLookupId",
                        "meterSerial",
                    ],
                ),
            );

            //--------------------------------------------------
            // Mapper
            //--------------------------------------------------

            const mapped =
                MeterValidationMapper.map(
                    responseBody,
                );

            //--------------------------------------------------
            // Validator
            //--------------------------------------------------

            validation.execute("Success", () =>
                validator.validateSuccess(
                    mapped.success,
                ),
            );

            validation.execute("Root Structure", () =>
                validator.validateRootStructure(
                    mapped,
                ),
            );

            validation.execute("Required Fields", () =>
                validator.validateRequiredFields(
                    mapped,
                ),
            );

            validation.execute("Valid Flag", () =>
                validator.validateValidFlag(
                    mapped,
                ),
            );

            validation.execute("Message", () =>
                validator.validateMessage(
                    mapped,
                ),
            );

            validation.execute("Message Trim", () =>
                validator.validateMessageTrim(
                    mapped,
                ),
            );

            validation.execute("Meter Lookup Id", () =>
                validator.validateMeterLookupId(
                    mapped,
                ),
            );

            validation.execute("Meter Serial", () =>
                validator.validateMeterSerial(
                    mapped,
                ),
            );

            validation.execute("Meter Serial Trim", () =>
                validator.validateMeterSerialTrim(
                    mapped,
                ),
            );

            validation.execute("Meter Serial Length", () =>
                validator.validateMeterSerialLength(
                    mapped,
                ),
            );

            validation.execute("No Null Values", () =>
                validator.validateNoNullValues(
                    mapped,
                ),
            );

            validation.execute("No Undefined Values", () =>
                validator.validateNoUndefinedValues(
                    mapped,
                ),
            );

            validation.execute("Lookup Id Range", () =>
                validator.validateLookupIdRange(
                    mapped,
                ),
            );

            validation.execute("Lookup Id Positive", () =>
                validator.validateLookupIdPositive(
                    mapped,
                ),
            );

            validation.execute("Message Length", () =>
                validator.validateMessageLength(
                    mapped,
                ),
            );

            validation.execute("Message Characters", () =>
                validator.validateMessageCharacters(
                    mapped,
                ),
            );

            validation.execute("Meter Serial Characters", () =>
                validator.validateMeterSerialCharacters(
                    mapped,
                ),
            );

            validation.execute("String Fields", () =>
                validator.validateStringFields(
                    mapped,
                ),
            );

            validation.execute("Numeric Fields", () =>
                validator.validateNumericFields(
                    mapped,
                ),
            );

            validation.execute("Boolean Field", () =>
                validator.validateBooleanField(
                    mapped,
                ),
            );

            validation.execute("Response Integrity", () =>
                validator.validateResponseIntegrity(
                    mapped,
                ),
            );

            validation.execute("Meter Identity", () =>
                validator.validateMeterIdentity(
                    mapped,
                ),
            );

            validation.execute("Object Size", () =>
                validator.validateObjectSize(
                    mapped,
                ),
            );

            validation.execute("No Extra Fields", () =>
                validator.validateNoExtraFields(
                    mapped,
                ),
            );

            validation.execute("Business Rules", () =>
                validator.validateBusinessRules(
                    mapped,
                ),
            );

            // -------- Continue in Part 4B --------

            validation.execute("Valid Meter Rule", () =>
              validator.validateValidMeterRule(
                  mapped,
              ),
          );

          validation.execute("Invalid Meter Rule", () =>
              validator.validateInvalidMeterRule(
                  mapped,
              ),
          );

          validation.execute("Eligible Meter Message", () =>
              validator.validateEligibleMeterMessage(
                  mapped,
              ),
          );

          validation.execute("Ineligible Meter Message", () =>
              validator.validateIneligibleMeterMessage(
                  mapped,
              ),
          );

          validation.execute("Meter Lookup Relationship", () =>
              validator.validateMeterLookupRelationship(
                  mapped,
              ),
          );

          validation.execute("Message Consistency", () =>
              validator.validateMessageConsistency(
                  mapped,
              ),
          );

          validation.execute("Serial Consistency", () =>
              validator.validateSerialConsistency(
                  mapped,
              ),
          );

          validation.execute("Meter Serial Numeric", () =>
              validator.validateMeterSerialNumeric(
                  mapped,
              ),
          );

          validation.execute("Lookup Id Consistency", () =>
              validator.validateLookupIdConsistency(
                  mapped,
              ),
          );

          validation.execute("Valid Flag Consistency", () =>
              validator.validateValidFlagConsistency(
                  mapped,
              ),
          );

          validation.execute("Message Not Empty", () =>
              validator.validateMessageNotEmpty(
                  mapped,
              ),
          );

          validation.execute("Meter Serial Not Empty", () =>
              validator.validateMeterSerialNotEmpty(
                  mapped,
              ),
          );

          validation.execute("Meter Lookup Exists", () =>
              validator.validateMeterLookupExists(
                  mapped,
              ),
          );

          validation.execute("No Whitespace Serial", () =>
              validator.validateNoWhitespaceSerial(
                  mapped,
              ),
          );

          validation.execute("No Whitespace Message", () =>
              validator.validateNoWhitespaceMessage(
                  mapped,
              ),
          );

          validation.execute("Meter Lookup Safe Range", () =>
              validator.validateMeterLookupSafeRange(
                  mapped,
              ),
          );

          validation.execute("Serial Length", () =>
              validator.validateSerialLength(
                  mapped,
              ),
          );

          validation.execute("Message Safe Length", () =>
              validator.validateMessageSafeLength(
                  mapped,
              ),
          );

          validation.execute("Response Object Integrity", () =>
              validator.validateResponseObjectIntegrity(
                  mapped,
              ),
          );

          validation.execute("Response Object Defined", () =>
              validator.validateResponseObjectDefined(
                  mapped,
              ),
          );

          validation.execute("Meter Lookup Not Zero", () =>
              validator.validateMeterLookupNotZero(
                  mapped,
              ),
          );

          validation.execute("Meter Serial Format", () =>
              validator.validateMeterSerialFormat(
                  mapped,
              ),
          );

          validation.execute("Backend Business Rule", () =>
              validator.validateBackendBusinessRule(
                  mapped,
              ),
          );

          validation.printSummary(
              "Meter Replacement Meter Validation API",
              responseTime,
          );
      },
  );
});