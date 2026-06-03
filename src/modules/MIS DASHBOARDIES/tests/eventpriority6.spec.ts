import { test } from "../../../fixtures/api.fixture";
import { EventPriorityApi } from "../Api/eventpriority6.api";
import { EventPriorityMapper} from "../Mapper/eventpriority6.mapper";
import { EventPriorityValidator }  from "../Validator/eventpriority6.validator";
import { eventPriorityQueries } from "../Data/eventpriority6.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
test.describe( "MIS Event Priority6 API",() => {
        eventPriorityQueries.forEach(
            query => {  
                test(query.period,async ({authenticatedApi}) => {
                        const api =new EventPriorityApi(authenticatedApi);
                        const result =await api.getPriorityData(query.priority,{period:query.period});
                        if ( result.timeout) {console.log(`${query.period}Timeout`);return;}
                        const assert =new AssertionEngine();
                        const validation =new ValidationEngine();
                        validation.execute("Status",() => 
                            assert.validateStatusCode(result.rawResponse!,200)
                        );
                        validation.execute("Content",() => 
                            assert.validateContentType(result.rawResponse!)
                        );
                        validation.execute("Response Time",() => 
                            assert.validateResponseTime(result.responseTime,120000)
                        );
                        validation.execute("Security",() => 
                            assert.validateSensitiveData(result.responseBody)
                        );
                        const data =EventPriorityMapper.map(result.responseBody.data);
                        const validator = new EventPriorityValidator();
                        validation.execute("Backend",() => 
                            validator.validate(data)
                    );
                    validation.execute("Investigation",() => 
                        validator.validateBusinessInvestigation(data)
                );
                    validation.printSummary(query.period,result.responseTime);
                    });
            });
    });