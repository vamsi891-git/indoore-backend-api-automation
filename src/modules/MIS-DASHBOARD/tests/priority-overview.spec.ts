import { test } from "../../../fixtures/api.fixture";
import { PriorityOverviewApi } from "../Api/priority-overview.api";
import { PriorityOverviewMapper}  from "../Mapper/priority-overview.mapper";
import { PriorityOverviewValidator } from "../Validator/priority-overview.validator";
import {  priorityOverviewQuery} from "../Data/priority-overview.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
test.describe("MIS Priority Overview API",() => {
        test("Validate Priority Overview",
            {
                tag: [
                    "@smoke",           
                    "@priority-overview"
                ]
            },
            async ({authenticatedApi}) => {
              const api =new PriorityOverviewApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                } = await api.getPriorityOverview(priorityOverviewQuery);
                const assert =new AssertionEngine();
                const validation =new ValidationEngine();
                validation.execute("Status",() => 
                    assert.validateStatusCode(rawResponse,200)
                );
                validation.execute("Content",() => 
                    assert.validateContentType(rawResponse,"application/json")
                );
                validation.execute("Response Time",() => 
                    assert.validateResponseTime(responseTime,120000)
                );
                validation.execute("Sensitive Data",() => 
                    assert.validateSensitiveData(responseBody)
                );
                const data =PriorityOverviewMapper.mapPriorityOverview(responseBody.data);
                const validator =new PriorityOverviewValidator();
                validation.execute("Response Validation",() => 
                    validator.validateResponse(responseBody)
                );
                validation.execute("Date Validation",() => 
                    validator.validateDates(data)
                );
                validation.execute("Priority Exists",() => 
                    validator.validatePrioritiesExist(data)
                );
                validation.execute("Priority Structure",() => 
                    validator.validatePriorityStructure(data)
                );
                validation.execute("Priority Order",() => 
                    validator.validatePriorityOrdering(data)
                );
                validation.execute("Expected Priorities",() => 
                    validator.validateExpectedPriorities(data)
                );
                validation.printSummary("Priority Overview API",responseTime);
            }
        );
    });