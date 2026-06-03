import { test } from "../../../fixtures/api.fixture";
import { EventPriorityOverviewApi} from "../Api/eventpriorityoverview.api";
import { EventPriorityOverviewMapper } from "../Mapper/eventpriorityoverview.mapper";
import { EventPriorityOverviewValidator } from "../Validator/eventpriorityoverview.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
test.describe("MIS Event Priority Overview API",() => {
        test( "Validate Priority Overview", async ({authenticatedApi}) => {
                const api =new EventPriorityOverviewApi(authenticatedApi);
                const {
                    rawResponse,
                    responseBody,
                    responseTime
                }=await api.getPriorityOverview();
                const assert =new AssertionEngine();
                const validation =new ValidationEngine();
                validation.execute("Status",() => 
                    assert.validateStatusCode(rawResponse!,200));
                validation.execute("Content Type",() => 
                    assert.validateContentType(rawResponse!));
                validation.execute("Response Time",() => 
                    assert.validateResponseTime(responseTime,120000));
                validation.execute("Sensitive Data",() => 
                    assert.validateSensitiveData(responseBody));
                const data = EventPriorityOverviewMapper.map(responseBody.data);
                const validator =new EventPriorityOverviewValidator();
                validation.execute("Response",() => 
                    validator.validateResponse(responseBody));
                validation.execute("Backend Validation",() => 
                    validator.validate(data));
                validation.execute("Investigation",() => 
                    validator.validateBusinessInvestigation(data));
                validation.printSummary("Priority Overview",responseTime);
            });
    });