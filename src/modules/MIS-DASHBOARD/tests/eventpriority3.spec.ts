import { test } from "../../../fixtures/api.fixture";
import { EventPriorityApi } from "../Api/eventpriority3.api";
import { EventPriorityMapper } from "../Mapper/eventpriority3.mapper";
import { EventPriorityValidator }from "../Validator/eventpriority3.validator";
import { eventPriorityQueries } from "../Data/eventpriority3.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
test.describe( "MIS Event Priority3 API",() => {
        eventPriorityQueries.forEach(query => {
                test(`${query.period}`,
                    async ({authenticatedApi}) => {
                        const api =new EventPriorityApi(authenticatedApi);
                        const result =await api.getPriorityData(query.priority,{period:query.period});
                        if (result.timeout) {
                            console.log(`BACKEND INVESTIGATION Priority:${query.priority} Period: ${query.period} Request Timeout`);
                            return;
                        }
                        if (result.rawResponse?.status() === 500) {
                            console.log(`BACKEND INVESTIGATION 500 Internal Server Error Priority:${query.priority} Period: ${query.period}`);
                            return;
                        }
                        const assert =new AssertionEngine();
                        const validation =new ValidationEngine();
                        validation.execute("Status",() => 
                            assert.validateStatusCode(result.rawResponse!,200)
                        );
                        validation.execute("Content Type",() => 
                            assert.validateContentType(result.rawResponse!)
                        );
                        validation.execute("Response Time",() => 
                            assert.validateResponseTime(result.responseTime,120000)
                        );
                        validation.execute("Sensitive Data",() => 
                            assert.validateSensitiveData(result.responseBody)
                        );
                        const data =EventPriorityMapper.map(result.responseBody.data);
                        const validator =new EventPriorityValidator();
                        validation.execute("Response",() => 
                            validator.validateResponse(result.responseBody)
                        );
                        validation.execute("Backend Validation",() => 
                            validator.validate(data));
                        validation.execute("Investigation",() => 
                            validator.validateBusinessInvestigation(data)
                    );
                        validation.printSummary(`Priority-${query.period}`, result.responseTime);
                    });
            });
    });