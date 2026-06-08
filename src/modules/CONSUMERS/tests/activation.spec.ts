import { test } from "../../../../src/fixtures/api.fixture";
import { ActivationApi } from "../Api/activation.api";
import { activationData } from "../Data/activation.data";
import { ActivationMapper } from "../Mapper/activation.mapper";
import { ActivationValidator } from "../Validator/activation.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";

test.describe("Consumer Activation API", () => {
    test(
        "Validate Consumer Activation API",
        {
            tag: ["@consumer", "@activation", "@smoke"],
        },
        async ({ authenticatedApi }) => {
            const api = new ActivationApi(authenticatedApi);
            const { consumerId, requestStatus, maxResponseTime } = activationData;

            const { rawResponse, responseBody, responseTime } =
                await api.updateActivation(consumerId, {
                    status: requestStatus,
                });

            await PerformanceTracker.track(
                rawResponse,
                "Consumer Activation API",
                `${process.env.BASE_URL}/indore/consumers/${consumerId}/activation`,
                responseTime,
            );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new ActivationValidator();

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

            const mapped = ActivationMapper.map(responseBody);
            const { consumer } = mapped;

            validation.execute("Success", () =>
                validator.validateSuccess(mapped.success),
            );
            validation.execute("Root Structure", () =>
                validator.validateRootStructure(mapped),
            );
            validation.execute("Data Required Fields", () =>
                assert.validateRequiredFields(responseBody.data, [
                    "consumer",
                    "previousStatus",
                ]),
            );
            validation.execute("Consumer Required Fields", () =>
                validator.validateConsumerRequiredFields(consumer),
            );
            validation.execute("Consumer Structure", () =>
                validator.validateConsumerStructure(consumer),
            );
            validation.execute("Consumer Id", () =>
                validator.validateConsumerId(consumer, consumerId),
            );
            validation.execute("Table Ref Id", () =>
                validator.validateTableRefId(consumer),
            );
            validation.execute("Consumer Name", () =>
                validator.validateConsumerName(consumer),
            );
            validation.execute("Allowed Statuses", () =>
                validator.validateAllowedStatuses(
                    consumer,
                    mapped.previousStatus,
                ),
            );
            validation.execute("Request Status Echo", () =>
                validator.validateRequestStatusEcho(consumer, requestStatus),
            );
            validation.execute("Previous Status", () =>
                validator.validatePreviousStatus(mapped.previousStatus),
            );
            validation.execute("Status Transition", () =>
                validator.validateStatusTransition(
                    consumer,
                    mapped.previousStatus,
                    requestStatus,
                ),
            );
            validation.execute("NaN Values", () =>
                validator.validateNaNValues(consumer),
            );
            validation.execute("Business Rules", () =>
                validator.validateBusinessRules(consumer),
            );
            validation.execute("Data Present Backend Rules", () =>
                validator.validateDataPresentBackendRules(
                    mapped,
                    consumerId,
                    requestStatus,
                ),
            );

            validation.printSummary("Consumer Activation API", responseTime);
        },
    );
});
