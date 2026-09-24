import { test } from "../../../fixtures/api.fixture";
import { PerformanceTracker } from "../../../core/utils/performance.tracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { EventReportApi } from "../Api/eventreport.api";
import {eventReportMaxResponseTimeMs,eventReportTestCases,resolveEventReportContractBody,resolveEventReportQuery,} from "../Data/eventreport.data";
import {EventReportMapper,type EventReportErrorBody,} from "../Mapper/eventreport.mapper";
import { EventReportValidator } from "../Validator/eventreport.validator";
import { skipIfReportsInternalError } from "../utils/reports-env.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
test.describe("Event report", () => {
    test.describe.configure({ retries: 0 });
    test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);
    for (const testCase of eventReportTestCases) {
        test(
            testCase.testName,
            { tag: testCase.tags },
            async ({ authenticatedApi }) => {
                const expectedStatus = testCase.expectedStatus ?? 200;
                const validator = new EventReportValidator();
                const assert = new ApiValidationHelper();
                const validation = new ApiValidationHelper();

                if (testCase.isContractFixture) {
                    const fixtureBody = resolveEventReportContractBody(
                        testCase.scenario,
                    );
                    if (!fixtureBody) {
                        test.skip(true, "Missing event report contract body");
                        return;
                    }
                    const mapped = EventReportMapper.map(fixtureBody);
                    validation.execute("Required Fields", () =>
                        assert.validateRequiredFields(fixtureBody, ["success","data",]),
                    );
                    validation.execute("Contract Scenario", () =>
                        validator.validateScenario(mapped, testCase.scenario),
                    );
                    validation.printSummary(testCase.testName, 0);
                    return;
                }
                const api = new EventReportApi(authenticatedApi);
                const query = resolveEventReportQuery(testCase.scenario);
                const { rawResponse, responseBody, responseTime } =
                    await api.getEventReport(query);
                await PerformanceTracker.track(
        rawResponse,
        testCase.testName,
        rawResponse.url(),
        responseTime
      );
                if (expectedStatus === 200) {
                    skipIfReportsInternalError(
                        rawResponse.status(),
                        responseBody,
                        "/indore/reports/event-report",
                    );
                }
                validation.execute("Status Validation", () =>
                    assert.validateStatusCode(rawResponse,expectedStatus,responseBody,),
                );
                validation.execute("Content Type", () =>
                    assert.validateContentType(rawResponse),
                );
                validation.execute("Response Time", () =>
                    assert.validateResponseTime(responseTime,eventReportMaxResponseTimeMs,),
                );
                validation.execute("Sensitive Data", () =>
                    assert.validateSensitiveData(responseBody),
                );
                if (expectedStatus !== 200) {
                    validation.execute("Validation Error", () =>
                        validator.validateValidationError(
                            responseBody as EventReportErrorBody,
                        ),
                    );
                    validation.printSummary(testCase.testName, responseTime);
                    return;
                }
                validation.execute("Required Fields", () =>
                    assert.validateRequiredFields(responseBody, ["success","data",]),
                );
                const mapped = EventReportMapper.map(responseBody);
                if (
                    testCase.scenario === "dev_live_primary" ||
                    testCase.scenario === "dev_live_page2"
                ) {
                    console.info(
                        JSON.stringify(
                            {
                                msg: "event_report_live_response",
                                query,
                                pagination: mapped.pagination,
                                columnKeys: mapped.columns.map((c) => c.key),
                                rowCount: mapped.rows.length,
                                sampleRow: mapped.rows[0] ?? null,
                            },
                            null,
                            2,
                        ),
                    );
                }
                validation.execute("Response Envelope", () =>
                    validator.validateResponseEnvelope(responseBody),
                );
                validation.execute("Event Report Scenario", () =>
                    validator.validateScenario(mapped,testCase.scenario,query.page,query.limit,),
                );

                validation.printSummary(testCase.testName, responseTime);
            },
        );
    }
});
