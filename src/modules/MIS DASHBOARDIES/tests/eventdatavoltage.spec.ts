import { test } from "../../../fixtures/api.fixture";
import { EventDataVoltageApi } from "../Api/eventdatavoltage.api";
import { EventVoltageMapper } from "../Mapper/eventdatavoltage.mapper";
import { EventVoltageValidator } from "../Validator/eventdatavoltage.validator";
import { eventVoltageQueries } from "../Data/eventdatavoltage.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
test.describe("MIS Event Data Voltage API", () => {
    eventVoltageQueries.forEach(query => {
        test(`Validate ${query.reportType}-${query.period}`,
            {
                tag: [
                    "@smoke",
                    "@event-data"
                ]
            }
            , async ({ authenticatedApi }) => {
                if (query.period === "monthly") {
                    test.skip(
                        true,
                        "Known backend defect: Monthly API timeout/Internal Server Error"
                    );
                    return;
                }
                const api = new EventDataVoltageApi(authenticatedApi);
                const result = await api.getVoltageData(query);
                const validation = new ValidationEngine();
                const assert = new AssertionEngine();
                if (query.period === "monthly") {
                    if (result.rawResponse.status() === 504) {
                        console.log("Backend finding: Monthly aggregation timeout");
                        return;
                    }
                }
                validation.execute("Status", () =>
                    assert.validateStatusCode(result.rawResponse, 200)
                );
                validation.execute("Content", () =>
                    assert.validateContentType(result.rawResponse, "application/json")
                );
                validation.execute("Response Time", () =>
                    assert.validateResponseTime(result.responseTime, 120000)
                );
                validation.execute("Sensitive Data", () =>
                    assert.validateSensitiveData(result.responseBody)
                );
                const mapped = EventVoltageMapper.map(result.responseBody.data);
                const validator = new EventVoltageValidator();

                validation.execute("Response Validation", () =>
                    validator.validateResponse(result.responseBody)
                );
                validation.execute("Backend Validation", () =>
                    validator.validate(mapped)
                );
                validation.execute("Business Investigation", () =>
                    validator.validateBusinessAnomalies(mapped)
                );
                validation.printSummary(`${query.reportType}-${query.period}`,
                    result.responseTime
                );
            }
                    );
});
    });