import { test } from "../../../../src/fixtures/api.fixture";
import { FeederElectricalParametersApi } from "../Api/feeder-electrical-parameters.api";
import { feederElectricalParametersData } from "../Data/feeder-electrical-parameters.data";
import { FeederElectricalParametersMapper } from "../Mapper/feeder-electrical-parameters.mapper";
import { FeederElectricalParametersValidator } from "../Validator/feeder-electrical-parameters.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Feeder Electrical Parameters API",() => {
        test("Validate Feeder Electrical Parameters API",
            {
                tag: [
                    "@feeder",
                    "@electrical-parameters",
                    "@smoke"
                ]
            },
            async ({authenticatedApi}) => {
                const api =new FeederElectricalParametersApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } =
                    await api.getElectricalParameters(
                        feederElectricalParametersData.feederCode
                    );
                await PerformanceTracker.track(
        rawResponse,
        "Feeder Electrical Parameters API",
        rawResponse.url(),
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
                // =====================================
                // MAPPER
                // =====================================
                const mapped =FeederElectricalParametersMapper.map(responseBody);
                const validator =new FeederElectricalParametersValidator();
                // =====================================
                // FIELD VALIDATION
                // =====================================
                validation.execute("Field Validation",() =>
                        validator.validateFields(mapped)
                );
                // =====================================
                // R PHASE
                // =====================================
                validation.execute("R Phase Structure Validation",() =>
                        validator.validatePhaseStructure(mapped.rPhase)
                );
                validation.execute("R Phase Unit Validation",() =>
                        validator.validateUnits(mapped.rPhase,feederElectricalParametersData.expectedVoltageUnit,feederElectricalParametersData.expectedCurrentUnit)
                );
                validation.execute("R Phase Type Validation",() =>
                        validator.validateTypes(mapped.rPhase)
                );
                validation.execute("R Phase Value Validation",() =>
                        validator.validatePositiveValues(mapped.rPhase)
                );
                validation.execute("R Phase NaN Validation",() =>
                        validator.validateNaN(mapped.rPhase)
                );
                // =====================================
                // Y PHASE
                // =====================================
                validation.execute("Y Phase Structure Validation",() =>
                        validator.validatePhaseStructure(mapped.yPhase)
                );
                validation.execute("Y Phase Unit Validation",() =>
                        validator.validateUnits(mapped.yPhase,feederElectricalParametersData.expectedVoltageUnit,feederElectricalParametersData.expectedCurrentUnit)
                );
                validation.execute("Y Phase Type Validation",() =>
                        validator.validateTypes(mapped.yPhase)
                );
                validation.execute("Y Phase Value Validation",() =>
                        validator.validatePositiveValues(mapped.yPhase)
                );
                validation.execute("Y Phase NaN Validation",() =>
                        validator.validateNaN(mapped.yPhase)
                );
                // =====================================
                // B PHASE
                // =====================================
                validation.execute("B Phase Structure Validation",() =>
                        validator.validatePhaseStructure(mapped.bPhase)
                );
                validation.execute("B Phase Unit Validation",() =>
                        validator.validateUnits(mapped.bPhase,feederElectricalParametersData.expectedVoltageUnit,feederElectricalParametersData.expectedCurrentUnit)
                );
                validation.execute("B Phase Type Validation",() =>
                        validator.validateTypes(mapped.bPhase)
                );
                validation.execute("B Phase Value Validation",() =>
                        validator.validatePositiveValues(mapped.bPhase)
                );
                validation.execute("B Phase NaN Validation",() =>
                    validator.validateNaN(mapped.bPhase)
                );
                // =====================================
                // BACKEND LOGIC
                // =====================================
                validation.execute("Last Communication Validation",() =>
                        validator.validateLastCommunication(mapped.lastCommunication)
                );
                validation.execute("Empty Meter Logic Validation",() =>
                        validator.validateEmptyMeterLogic(mapped)
                );
                // =====================================
                // SUMMARY
                // =====================================
                validation.printSummary("Feeder Electrical Parameters API",responseTime);
            }
        );
    }
);