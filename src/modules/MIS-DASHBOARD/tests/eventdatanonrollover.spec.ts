import { test } from "../../../fixtures/api.fixture";
import { EventNonRolloverApi } from "../Api/eventdatanonrollover.api";
import { EventNonRolloverMapper } from "../Mapper/eventdatanonrollover.mapper";
import {  EventNonRolloverValidator } from "../Validator/eventdatanonrollover.validator";
import { eventNonRolloverQueries } from "../Data/eventdatanonrollover.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { BackendResponse } from "../../../core/utils/backend-response.util";
test.describe("MIS Event NonRollover API",() => {
        eventNonRolloverQueries.forEach(query => {
                test(`${query.reportType}-${query.period}`,
                    async ({authenticatedApi}) => {
                        const api =new EventNonRolloverApi(authenticatedApi);
                        const result =await api.getNonRolloverData(query);
                        if (result.timeout) {
                            console.log( `BACKEND FINDING  ${query.reportType} ${query.period} Timeout>30s` );
                            return;
                        }
                        if (!result.rawResponse || result.responseBody === undefined) {
                            return;
                        }
                        const rawResponse = result.rawResponse;
                        const responseBody = result.responseBody;
                        const responseTime = result.responseTime;
                        if (rawResponse.status()=== 504) {
                            console.log("Gateway timeout");
                            return;
                        }
                        if (
                            BackendResponse.shouldSkipServerFailure(
                                rawResponse.status(),
                                `${query.reportType}-${query.period}`,
                                responseBody
                            )
                        ) {
                            return;
                        }
                        const assert =new AssertionEngine();
                        const validation =new ValidationEngine();
                        validation.execute("Status",() => 
                            assert.validateStatusCode(rawResponse,200));
                        validation.execute("Content Type",() => 
                            assert.validateContentType(rawResponse,"application/json"));
                        validation.execute("Response Time",() => 
                            assert.validateResponseTime(responseTime,120000));
                        validation.execute("Sensitive Data",() => 
                            assert.validateSensitiveData(responseBody));
                        const data =EventNonRolloverMapper.map(responseBody.data);
                        const validator =new EventNonRolloverValidator();
                        validation.execute("Response",() => 
                            validator.validateResponse(responseBody));
                        validation.execute("Backend Validation",() => 
                            validator.validate(data));
                        validation.execute("Investigation",() => 
                            validator.validateBusinessFindings(data));
                        validation.printSummary(`${query.reportType}-${query.period}`,
                            responseTime
                        );
                    });
            });
    });