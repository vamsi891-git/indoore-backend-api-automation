import { test } from "../../../../src/fixtures/api.fixture";
import { DtrPowerTriangleApi } from "../Api/dtrpowertriangle.api";
import { dtrPowerTriangleData } from "../Data/dtrpowertriangle.data";
import { DtrPowerTriangleMapper } from "../Mapper/dtrpowertriangle.mapper";
import { DtrPowerTriangleValidator } from "../Validator/dtrpowertriangle.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("DTR Power Triangle API", () => {
    test(
        "Validate DTR Power Triangle API",
        {
            tag: ["@dtr", "@power-triangle", "@smoke"],
        },
        async ({ authenticatedApi }) => {
            const api = new DtrPowerTriangleApi(authenticatedApi);
            const { rawResponse, responseBody, responseTime } =
                await api.getPowerTriangle(dtrPowerTriangleData.dtrCode);

            await PerformanceTracker.track(
                rawResponse,
                "DTR Power Triangle API",
                `${process.env.BASE_URL}/indore/dtr/${dtrPowerTriangleData.dtrCode}/power-triangle`,
                responseTime,
            );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new DtrPowerTriangleValidator();

            const mapped = DtrPowerTriangleMapper.map(
                rawResponse.ok()
                    ? responseBody
                    : { success: true, data: undefined },
            );

            const isTimeoutFallback =
                rawResponse.status() === 503 ||
                (rawResponse.status() === 200 && responseBody.success === false);

            const isEmptyTriangle =
                mapped.activeEnergyKWh === null &&
                mapped.reactiveEnergyKvarh === null &&
                mapped.apparentEnergyKVAh === null &&
                mapped.powerFactor === null;

            // =====================================
            // API VALIDATIONS
            // =====================================
            validation.execute("Status Code", () => {
                if (isTimeoutFallback && isEmptyTriangle) {
                    validator.validateTimeoutFallbackStatus(rawResponse.status());
                    validator.validateTimeoutFallbackTriangle(mapped);
                    return;
                }
                assert.validateStatusCode(rawResponse, 200, responseBody);
            });
            validation.execute("Content Type", () =>
                assert.validateContentType(rawResponse),
            );
            validation.execute("Response Time", () =>
                assert.validateResponseTime(
                    responseTime,
                    dtrPowerTriangleData.maxResponseTime,
                ),
            );
            validation.execute("Sensitive Data", () =>
                assert.validateSensitiveData(responseBody),
            );
            const triangleData = responseBody.data;
            if (triangleData) {
                validation.execute("Required Fields", () =>
                    assert.validateRequiredFields(
                        triangleData,
                        [...dtrPowerTriangleData.requiredFields],
                    ),
                );
            }

            // =====================================
            // BACKEND VALIDATIONS
            // =====================================
            validation.execute("Response Envelope", () => {
                if (isTimeoutFallback && isEmptyTriangle) {
                    return;
                }
                validator.validateResponseEnvelope(responseBody);
            });
            validation.execute("Field Validation", () =>
                validator.validateFields(mapped),
            );
            validation.execute("Type Validation", () =>
                validator.validateTypes(mapped),
            );
            validation.execute("Reactive Energy Derivation", () =>
                validator.validateReactiveEnergyDerivation(mapped),
            );
            validation.execute("Power Factor Validation", () =>
                validator.validatePowerFactor(mapped.powerFactor),
            );
            validation.execute("Energy Validation", () =>
                validator.validateEnergyValues(mapped),
            );
            validation.execute("Empty Reading State", () =>
                validator.validateEmptyReadingState(mapped),
            );
            validation.execute("IP Source Consistency", () =>
                validator.validateIpSourceConsistency(mapped),
            );
            validation.execute("Power Factor With Readings", () =>
                validator.validatePowerFactorWithReadings(mapped),
            );
            validation.execute("Finite Numbers", () =>
                validator.validateFiniteNumbers(mapped),
            );
            validation.execute("Business Logic", () =>
                validator.validateBusinessLogic(mapped),
            );

            validation.printSummary("DTR Power Triangle API", responseTime);
        },
    );
});
