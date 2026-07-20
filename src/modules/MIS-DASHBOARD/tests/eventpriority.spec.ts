import { test } from "../../../fixtures/api.fixture";
import { EventPriorityApi } from "../Api/eventpriority.api";
import { EventPriorityMapper } from "../Mapper/eventpriority.mapper";
import { EventPriorityValidator } from "../Validator/eventpriority.validator";
import { eventPriorityQueries }  from "../Data/eventpriority.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
test.describe("MIS Event Priority API",{tag: ["@smoke","@eventpriority"]},() => {
        eventPriorityQueries.forEach(
            query => {
                test(`${query.period}`,
                    async ({authenticatedApi}) => {
                        const api =new EventPriorityApi(authenticatedApi);
                        const result =await api.getPriorityData(query.priority,{ period:query.period});
                        const rawResponse = result.rawResponse;
                        if (result.timeout || !rawResponse) {
                            console.log(`BACKEND FINDING Priority API timeout ${query.period}`);
                            return;
                        }
                        const assert =new AssertionEngine();
                        const validation =new ValidationEngine();
                        validation.execute("Status",() => 
                        assert.validateStatusCode(rawResponse,200));
                        validation.execute("Content",() => 
                            assert.validateContentType(rawResponse,"application/json"));
                        validation.execute("Response Time",() => 
                            assert.validateResponseTime(result.responseTime,120000));
                        validation.execute("Sensitive Data",() => 
                            assert.validateSensitiveData(result.responseBody));
                        const data =EventPriorityMapper.map(result.responseBody.data);
                        const validator =new EventPriorityValidator();
                        validation.execute("Response",() => 
                            validator.validateResponse(result.responseBody));
                        validation.execute("Backend",() => 
                            validator.validate(data));
                        validation.execute("Investigation",() => 
                            validator.validateBusinessFindings(data));
                        validation.printSummary(`Priority ${query.period}`,result.responseTime);
                    });
            });
        });
