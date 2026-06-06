import { test } from "../../../../src/fixtures/api.fixture";
import { AssertionEngine } from "../../../../src/core/engine/assertion.engine";
import { ValidationEngine } from "../../../../src/core/engine/validation.engine";
import { ApiValidationHelper } from "../../../../src/core/helpers/api-validation.helper";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
import { BackendResponse } from "../../../../src/core/utils/backend-response.util";
import { EventDetailApi } from "../Api/eventdetail.api";
import { EventDetailData } from "../Data/eventdetail.data";
import { EventDetailMapper } from "../Mapper/eventdetail.mapper";
import { EventDetailValidator } from "../Validator/eventdetail.validator";

test.describe("Event Detail Report API", () => {
    test(
        "Validate Event Detail Report API",
        {
            tag: ["@smoke", "@reports", "@event-detail"],
        },
        async ({ authenticatedApi }, testInfo) => {
            const api = new EventDetailApi(authenticatedApi);
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new EventDetailValidator();

            const { fromDate, toDate, organisationLookupId, limit } =
                EventDetailData;

            const { rawResponse, responseBody, responseTime } =
                await api.getEventDetail(
                    fromDate,
                    toDate,
                    organisationLookupId,
                    limit,
                );

            const endpoint = `/indore/reports/event-detail?fromDate=${fromDate}&toDate=${toDate}&limit=${limit}&organisationLookupId=${organisationLookupId}`;
            const defectContext = {
                module: "REPORTS",
                endpoint,
                requestParams: {
                    fromDate,
                    toDate,
                    organisationLookupId,
                    limit,
                },
                responseStatus: rawResponse.status(),
                responseBody,
                expectedBehavior:
                    "GET /indore/reports/event-detail should return 200 with success=true, rows[], appliedFilters, previewNote, and pagination metadata for the requested date range and organisationLookupId.",
            };

            await PerformanceTracker.track(
                rawResponse,
                "Event Detail Report API",
                `${process.env.BASE_URL}${endpoint}`,
                responseTime,
            );

            try {
                if (BackendResponse.isServerError(rawResponse.status())) {
                    BackendResponse.logFinding(
                        "Event Detail Report API",
                        rawResponse.status(),
                        responseBody,
                    );
                }

                validation.execute("Status Code", () =>
                    assert.validateStatusCode(rawResponse, 200, responseBody),
                );
                validation.execute("Content Type", () =>
                    assert.validateContentType(rawResponse),
                );
                validation.execute("Response Time", () =>
                    assert.validateResponseTime(
                        responseTime,
                        EventDetailData.maxResponseTime,
                    ),
                );
                validation.execute("Sensitive Data", () =>
                    assert.validateSensitiveData(responseBody),
                );

                const mapped = EventDetailMapper.map(responseBody);
                const data = mapped.data;
                const rows = data.rows;

                validation.execute("Success", () =>
                    validator.validateSuccess(mapped),
                );
                validation.execute("Root Structure", () =>
                    validator.validateRootStructure(mapped),
                );
                validation.execute("Query Echo", () =>
                    validator.validateQueryEcho(data, fromDate, toDate, limit),
                );
                validation.execute("Date Range Format", () =>
                    validator.validateDateRangeFormat(data),
                );
                validation.execute("Scoped Meter Count", () =>
                    validator.validateScopedMeterCount(data),
                );
                validation.execute("Total Row Count", () =>
                    validator.validateTotalRowCount(data),
                );
                validation.execute("Truncation", () =>
                    validator.validateTruncation(data),
                );
                validation.execute("Preview Note", () =>
                    validator.validatePreviewNote(data),
                );
                validation.execute("Applied Filters", () =>
                    validator.validateAppliedFilters(data, organisationLookupId),
                );
                validation.execute("Rows Limit", () =>
                    validator.validateRowsLimit(rows, limit),
                );
                validation.execute("No Data Scenario", () =>
                    validator.validateNoDataScenario(data),
                );
                validation.execute("Rows Present When Total Positive", () =>
                    validator.validateRowsPresentWhenTotalPositive(data),
                );

                if (rows.length > 0) {
                    validation.execute("Rows Structure", () =>
                        validator.validateRowsStructure(rows),
                    );
                    validation.execute("Consumer Fields", () =>
                        validator.validateConsumerFields(rows),
                    );
                    validation.execute("Meter Fields", () =>
                        validator.validateMeterFields(rows),
                    );
                    validation.execute("Hierarchy Fields", () =>
                        validator.validateHierarchyFields(rows),
                    );
                    validation.execute("Event Fields", () =>
                        validator.validateEventFields(rows),
                    );
                    validation.execute("Duration Format", () =>
                        validator.validateDurationFormat(rows),
                    );
                    validation.execute("SL No Sequence", () =>
                        validator.validateSlNoSequence(rows),
                    );
                    validation.execute("Unique SL No", () =>
                        validator.validateUniqueSlNo(rows),
                    );
                    validation.execute("Unique Meter Event Combination", () =>
                        validator.validateUniqueMeterEventCombination(rows),
                    );
                }
            } finally {
                ApiValidationHelper.finalize(validation, {
                    apiName: "Event Detail Report API",
                    responseTime,
                    testInfo,
                    defectContext,
                });
            }
        },
    );
});
