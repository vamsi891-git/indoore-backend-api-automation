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
                    assert.validateRequiredFields(responseBody.data,["weekly","monthly","yearly"])
                );

                const data =EnergyConsumptionGraphMapper.map(responseBody);
                const validator =new EnergyConsumptionGraphValidator();
                validation.execute("Success",() => 
                    validator.validateSuccess(data)
                );

                validation.execute("Structure",() => 
                    validator.validateStructure(data)
                );
                validation.execute("Titles",() => 
                    validator.validateTitles(data)
                );
                validation.execute("Weekly Count",() => 
                    validator.validateWeeklyCount(data)
                );
                validation.execute("Monthly Count",() => 
                    validator.validateMonthlyCount(data)
                );
                validation.execute("Yearly Count",() => 
                    validator.validateYearlyCount(data)
                );
                validation.execute("Weekly Shape",() => 
                    validator.validatePointStructure(data.weekly.points)
                );
                validation.execute("Monthly Shape",() => 
                    validator.validatePointStructure(data.monthly.points)
                );
                validation.execute("Yearly Shape",() => 
                    validator.validatePointStructure(data.yearly.points)
                );
                validation.execute("Weekly Consumption",() => 
                    validator.validateConsumptionValues(data.weekly.points)
                );

                validation.execute("Monthly Consumption",() => 
                    validator.validateConsumptionValues(data.monthly.points)
                );
                validation.execute("Yearly Consumption",() => 
                    validator.validateConsumptionValues(data.yearly.points)
                );
                validation.execute("Day Labels",() => 
                    validator.validateDayLabels(data.weekly.points)
                );
                validation.execute("Month Labels",() => 
                    validator.validateYearLabels(data.yearly.points)
                );
                validation.execute("Business Rules",() => 
                    validator.validateBusinessRules(data)
                );
                validation.printSummary("Energy Consumption Graph API",responseTime
                );
            });
    });