import { test } from "../../../../src/fixtures/api.fixture";
import { DtrPowerTriangleApi} from "../Api/dtrpowertriangle.api";
import { dtrPowerTriangleData} from "../Data/dtrpowertriangle.data";
import { DtrPowerTriangleMapper} from "../Mapper/dtrpowertriangle.mapper";
import { DtrPowerTriangleValidator} from "../Validator/dtrpowertriangle.validator";
import { AssertionEngine} from "../../../core/engine/assertion.engine";
import { ValidationEngine} from "../../../core/engine/validation.engine";
import { PerformanceTracker} from "../../../core/utils/performancetracker";
test.describe("DTR Power Triangle API",() => {
        test("Validate DTR Power Triangle API",
            {
                tag: [
                    "@dtr",
                    "@power-triangle",
                    "@smoke"
                ]
            },
            async ({authenticatedApi}) => {
                const api =new DtrPowerTriangleApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } =await api.getPowerTriangle(dtrPowerTriangleData.dtrCode);
                await PerformanceTracker.track(
                    rawResponse,
                    "DTR Power Triangle API",
                    `${process.env.BASE_URL}/indore/dtr/${dtrPowerTriangleData.dtrCode}/power-triangle`,
                    responseTime
                );
                const assert =new AssertionEngine();
                const validation =new ValidationEngine();
                // =====================================
                // API VALIDATIONS
                // =====================================
                validation.execute("Status Code",() =>
                        assert.validateStatusCode(rawResponse,200)
                );
                validation.execute("Content Type",() =>
                        assert.validateContentType(rawResponse)
                );
                validation.execute("Response Time",() =>
                        assert.validateResponseTime(responseTime,30000)
                );
                validation.execute("Sensitive Data",() =>
                        assert.validateSensitiveData(responseBody)
                );
                validation.execute("Required Fields",() =>
                        assert.validateRequiredFields(responseBody.data,["activeEnergyKWh","reactiveEnergyKvarh","apparentEnergyKVAh","powerFactor"])
                );
                // =====================================
                // MAPPER
                // =====================================
                const mapped =DtrPowerTriangleMapper.map(responseBody);
                const validator =new DtrPowerTriangleValidator();
                // =====================================
                // BACKEND VALIDATIONS
                // =====================================
                validation.execute("Field Validation",() =>
                        validator.validateFields(mapped)
                );
                validation.execute("Type Validation",() =>
                        validator.validateTypes(mapped)
                );
                validation.execute("Power Factor Validation",() =>
                        validator.validatePowerFactor(mapped.powerFactor)
                );
                validation.execute("Energy Validation",() =>
                        validator.validateEnergyValues(mapped)
                );
                validation.execute("Fallback Logic",() =>
                        validator.validateFallbackLogic(mapped)
                );
                validation.execute("Reactive Energy Validation",() =>
                        validator.validateReactiveEnergy(mapped.reactiveEnergyKvarh)
                );
                validation.execute("Business Logic",() =>
                        validator.validateBusinessLogic(mapped)
                );
                validation.execute("NaN Validation",() =>
                        validator.validateNaN(mapped)
                );
                // =====================================
                // SUMMARY
                // =====================================
                validation.printSummary("DTR Power Triangle API",responseTime);
            }
        );
    }
);