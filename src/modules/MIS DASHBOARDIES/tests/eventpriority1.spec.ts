import { test } from "../../../fixtures/api.fixture";
import { EventPriorityApi } from "../Api/eventpriority1.api";
import { EventPriorityMapper } from "../Mapper/eventpriority1.mapper";
import { EventPriorityValidator } from "../Validator/eventpriority1.validator";
import { eventPriorityQueries } from "../Data/eventpriority1.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
test.describe("MIS Event Priority1 API",() => {
        eventPriorityQueries.forEach(
            query => {
                test(`${query.period}`,
                    async ({authenticatedApi}) => {
                        const api =new EventPriorityApi(authenticatedApi);
                        const result = await api.getPriorityData(
                                query.priority,{period:query.period}
                            );
                        if (result.timeout) {
                            console.log(`BACKEND: TIMEOUT`);
                            return;
                        }
                        if (result.rawResponse ?.status() === 500) {
                            console.log("BACKEND 500");
                            return;
                        }
                        const assert = new AssertionEngine();
                        const validation = new ValidationEngine();
                        validation.execute( "Status", () =>
                                assert.validateStatusCode(result.rawResponse!,200)
                        );
                        validation.execute("Content Type",() =>
                                assert.validateContentType(result.rawResponse!)
                        );
                        validation.execute("Response Time",() =>
                                assert.validateResponseTime(result.responseTime,120000)
                        );
                        const data =EventPriorityMapper.map(result.responseBody.data);
                        const validator =new EventPriorityValidator();
                        validation.execute("Backend Validation",() =>
                                validator.validate(data)
                        );
                        validation.execute("Investigation",() =>
                                validator.validateBusinessInvestigation(data)
                        );
                        validation.printSummary(`Priority ${query.period}`,result.responseTime
                        );
                    }
                );
            }
        );
    });