import { test } from "../../../../src/fixtures/api.fixture";
import { ActivationApi } from "../Api/activation.api";
import { activationData } from "../Data/activation.data";
import { ActivationMapper } from "../Mapper/activation.mapper";
import { ActivationValidator } from "../Validator/activation.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine }  from "../../../core/engine/validation.engine";
import { PerformanceTracker }  from "../../../../src/core/utils/performancetracker";
test.describe("Consumer Activation API",() => {
        test("Validate Consumer Activation API",
            {
                tag: [
                    "@consumer",
                    "@activation",
                    "@smoke"
                ]
            },
            async ({authenticatedApi}) => {
                const api =new ActivationApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } = await api.getActivation(activationData.consumerId,activationData.allowedStatuses[0]);

                await PerformanceTracker.track(
                    rawResponse,
                    "Consumer Activation API",
                    `${process.env.BASE_URL}/indore/consumers/${activationData.consumerId}/activation`,
                    responseTime
                );
                const assert = new AssertionEngine();
                const validation =  new ValidationEngine();
                /*
                =====================================
                BASE API VALIDATIONS
                =====================================
                */
                validation.execute("Status Validation",() =>
                        assert.validateStatusCode(rawResponse,200)
                );
                validation.execute("Content Type",() =>
                        assert.validateContentType(rawResponse)
                );
                validation.execute("Response Time",() =>
                        assert.validateResponseTime(responseTime,activationData.maxResponseTime)
                );
                validation.execute("Sensitive Data",() =>
                        assert.validateSensitiveData(responseBody)
                );
                validation.execute("Required Fields",() =>
                        assert.validateRequiredFields(responseBody.data,["consumer","previousStatus"])
                );
                /*
                =====================================
                MAPPER
                =====================================
                */
                const data = ActivationMapper.map(responseBody);
                const validator = new ActivationValidator();
                /*
                =====================================
                BACKEND VALIDATIONS
                =====================================
                */
                validation.execute("Consumer Validation",() =>
                        validator.validateConsumer(data)
                );
                validation.execute("Type Validation",() =>
                        validator.validateTypes(data)
                );
                validation.execute("Consumer Id Validation",() =>
                        validator.validateConsumerId(data)
                );
                validation.execute("Table Ref Id Validation",() =>
                        validator.validateTableRefId(data)
                );
                validation.execute("Consumer Name Validation",() =>
                        validator.validateConsumerName(data)
                );
                validation.execute("Status Validation",() =>
                        validator.validateStatus(data)
                );
                validation.execute("Previous Status Validation",() =>
                        validator.validatePreviousStatus(data)
                );
                validation.execute("NaN Validation",() =>
                        validator.validateNaN(data)
                );
                validation.execute("Backend Logic",() =>
                        validator.validateBackendLogic(data)
                );
                validation.execute("Fallback Logic",() =>
                        validator.validateFallbackLogic(data)
                );
                validation.execute("Business Rules",() =>
                        validator.validateBusinessRules(data)
                );
                /*
                =====================================
                SUMMARY
                =====================================
                */
                validation.printSummary("Consumer Activation API",responseTime);
            }
        );
    }
);