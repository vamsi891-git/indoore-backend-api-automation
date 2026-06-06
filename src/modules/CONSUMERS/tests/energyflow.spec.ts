import { test } from "../../../../src/fixtures/api.fixture";
import { EnergyFlowApi } from "../Api/energyflow.api";
import { energyFlowData } from "../Data/energyflow.data";
import { EnergyFlowMapper} from "../Mapper/energyflow.mapper";
import { EnergyFlowValidator} from "../Validator/energyflow.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import {  PerformanceTracker } from "../../../../src/core/utils/performancetracker";
test.describe("Energy Flow API",() => {
        test("Validate Energy Flow API",
            {
                tag: [
                    "@consumer",
                    "@energy",
                    "@flow",
                    "@smoke"
                ]
            },
            async ({authenticatedApi }) => {
                const api =new EnergyFlowApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                }=await api.getEnergyFlow(energyFlowData.consumerNumber);
                await PerformanceTracker.track(
                    rawResponse,
                    "Energy Flow API",
                    `${process.env.BASE_URL}/indore/consumers/${energyFlowData.consumerNumber}/energy-flow`,
                    responseTime
                );
                const assert = new AssertionEngine();
                const validation = new ValidationEngine();
                validation.execute("Status",() => 
                    assert.validateStatusCode(rawResponse,200)
                );
                validation.execute("Content Type",() => 
                    assert.validateContentType(rawResponse)
                );
                validation.execute("Response Time",() => 
                    assert.validateResponseTime(responseTime,energyFlowData.maxResponseTime
                    )
                );
                validation.execute("Sensitive Data",() => 
                    assert.validateSensitiveData(responseBody)
                );
                validation.execute("Required Fields",() =>
                    assert.validateRequiredFields(responseBody.data, ["period", "points"])
                );
                const data =EnergyFlowMapper.map(responseBody);
                const validator = new EnergyFlowValidator();
                validation.execute("Success",() => 
                    validator.validateSuccess(data)
                );
                validation.execute("Structure",() => 
                    validator.validateStructure(data)
                );
                validation.execute("Period",() =>
                    validator.validatePeriod(data)
                );
                validation.execute("Points Count",() => 
                    validator.validatePointsCount(data)
                );
                validation.execute("Point Structure",() => 
                    validator.validatePointStructure(data.points)
                );
                validation.execute("Label Format",() =>
                    validator.validateLabelFormat(data.points)
                );
                validation.execute("Energy Values",() => 
                    validator.validateEnergyValues(data.points)
                );
                validation.execute("Business Rules",() => 
                    validator.validateBusinessLogic(data)
                );
                validation.printSummary("Energy Flow API",responseTime
                );
            });
    });
