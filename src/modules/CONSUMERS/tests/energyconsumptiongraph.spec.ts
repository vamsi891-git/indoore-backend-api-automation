import { test } from "../../../../src/fixtures/api.fixture";
import { EnergyConsumptionGraphApi } from "../Api/energyconsumptiongraph.api";
import { energyConsumptionGraphData } from "../Data/energyconsumptiongraph.data";
import { EnergyConsumptionGraphMapper } from "../Mapper/energyconsumptiongraph.mapper";
import { EnergyConsumptionGraphValidator }  from "../Validator/energyconsumptiongraph.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine"
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
test.describe("Energy Consumption Graph API",() => {
        test("Validate Energy Consumption Graph API",
            {
                tag: [
                    "@consumer",
                    "@energy",
                    "@graph",
                    "@smoke"
                ]
            },
            async ({authenticatedApi}) => {
                const api =new EnergyConsumptionGraphApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                }=await api.getEnergyConsumptionGraph(energyConsumptionGraphData.consumerNumber);
                await PerformanceTracker.track(
                    rawResponse,
                    "Energy Consumption Graph API",
                    `${process.env.BASE_URL}/indore/consumers/${energyConsumptionGraphData.consumerNumber}/energy-consumption-graph`,
                    responseTime
                );

                const assert =new AssertionEngine();
                const validation =new ValidationEngine();
                validation.execute("Status",() => 
                    assert.validateStatusCode(rawResponse,200)
                );
                validation.execute("Content Type",() => 
                    assert.validateContentType(rawResponse)
                );
                validation.execute("Response Time",() => 
                    assert.validateResponseTime(responseTime,energyConsumptionGraphData.maxResponseTime)
                );
                validation.execute("Sensitive Data",() => 
                    assert.validateSensitiveData(responseBody)
                );
                validation.execute("Required Fields",() => 
                    assert.validateRequiredFields(responseBody.data,["period","points"])
                );

                const data =EnergyConsumptionGraphMapper.map(responseBody);
                const validator =new EnergyConsumptionGraphValidator();
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
                validation.execute("Consumption Values",() => 
                    validator.validateConsumptionValues(data.points)
                );
                validation.execute("Business Rules",() => 
                    validator.validateBusinessRules(data)
                );
                validation.printSummary("Energy Consumption Graph API",responseTime
                );
            });
    });
