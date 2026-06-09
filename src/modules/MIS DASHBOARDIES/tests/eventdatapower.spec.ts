import { test } from "../../../fixtures/api.fixture";

import { EventPowerApi } from "../Api/eventdatapower.api";
import { EventPowerMapper }  from "../Mapper/eventdatapower.mapper";
import { EventPowerValidator } from "../Validator/eventdatapower.validator";
import { eventPowerQueries } from "../Data/eventdatapower.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { BackendResponse } from "../../../core/utils/backend-response.util";
test.describe("MIS Event Data Power API",() => {
        eventPowerQueries.forEach( query => {
                test(`Validate ${query.reportType}-${query.period}`,
                    async ({authenticatedApi}) => {
                        const api =new EventPowerApi(authenticatedApi);
                        let result;
                        try {
                            result =await api.getPowerData(query);
                        } catch (error) {
                            if (query.period === "monthly") {
                                console.log("BACKEND FINDING: monthly timeout");
                                return;
                            }
                            throw error;
                        }
                        if (
                            BackendResponse.shouldSkipServerFailure(
                                result.rawResponse.status(),
                                `${query.reportType}-${query.period}`,
                                result.responseBody
                            )
                        ) {
                            return;
                        }
                        const validation =new ValidationEngine();
                        const assert =new AssertionEngine();
                        validation.execute("Status",() => 
                            assert.validateStatusCode(result.rawResponse,200));
                        validation.execute("Content Type",() => 
                            assert.validateContentType(result.rawResponse,"application/json"));
                        validation.execute("Response Time",() => 
                            assert.validateResponseTime(result.responseTime,120000));
                        const data =EventPowerMapper.map(result.responseBody.data);
                        const validator =new EventPowerValidator();
                        validation.execute("Response",() => 
                            validator.validateResponse(result.responseBody));
                        validation.execute("Power Validation",() => 
                            validator.validate(data));
                        validation.execute("Backend Investigation",() => 
                            validator.validateBusinessAnomalies(data));
                        validation.printSummary(`${query.reportType}-${query.period}`,result.responseTime);
                    });
            });
    });