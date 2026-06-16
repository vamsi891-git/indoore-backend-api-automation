import { test } from "../../../../src/fixtures/api.fixture";
import { RealTimePowerApi } from "../Api/realtimepower.api";
import { realTimePowerData } from "../Data/realtimepower.data";
import { RealTimePowerMapper } from "../Mapper/realtimepower.mapper";
import { RealTimePowerValidator } from "../Validator/realtimepower.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
test.describe("Real Time Power API",() => {
        test("Validate Real Time Power API",
            {
                tag: ["@consumer","@power","@smoke"]
            },
            async ({authenticatedApi}) => {
                const api =new RealTimePowerApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime,
                }=await api.getRealTimePower(realTimePowerData.consumerNumber);
                await PerformanceTracker.track(rawResponse,"Real Time Power API", `${process.env.BASE_URL}/indore/consumers/${realTimePowerData.consumerNumber}/real-time-power`,responseTime);
                const assert =new AssertionEngine();
                const validation =new ValidationEngine();
                validation.execute("Status",() =>
                        assert.validateStatusCode(rawResponse,200)
                );
                validation.execute("Content Type",() =>
                        assert.validateContentType(rawResponse)
                );
                validation.execute("Response Time",() =>
                        assert.validateResponseTime(responseTime,realTimePowerData.maxResponseTime)
                );
                validation.execute("Sensitive Data",() =>
                        assert.validateSensitiveData(responseBody)
                );
                validation.execute("Required Fields",() =>
                        assert.validateRequiredFields(responseBody,["success","data"])
                );
                const data =RealTimePowerMapper.map(responseBody);
                validation.execute("Mapped Required Fields",() =>
                        assert.validateRequiredFields(data,["rPhase","yPhase","bPhase"])
                );
                const validator =new RealTimePowerValidator();
                validation.execute("Success",() => 
                    validator.validateSuccess(data)
            );
                validation.execute("R Phase",() => 
                    validator.validateRPhaseExists(data)
                );
                validation.execute("Single Phase",() => 
                    validator.validateSinglePhaseLogic(data)
                );
                validation.execute("Units",() => 
                    validator.validateUnits(data)
                );
                validation.execute("Nullable",() => 
                    validator.validateNullableValues(data)
                );
                validation.execute("Voltage",() => 
                    validator.validateVoltageRange(data)
                );
                validation.execute("Current",() => 
                    validator.validateCurrentRange(data)
                );
                validation.execute("Power Factor",() => 
                    validator.validatePowerFactor(data)
                );
                validation.execute("Cross Field",() => 
                    validator.validateCrossField(data)
                );
                validation.execute("Business Rules",() => 
                    validator.validateBusinessRules(data)
                );
                validation.printSummary("Real Time Power API",responseTime
                );
            });
    });