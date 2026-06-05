import { test } from "../../../../src/fixtures/api.fixture";
import { AssertionEngine } from "../../../../src/core/engine/assertion.engine";
import { ValidationEngine } from "../../../../src/core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";
import { EventReportApi } from "../Api/eventreport.api";
import { EventReportData } from "../Data/eventreport.data";
import { EventReportMapper } from "../Mapper/eventreport.mapper";
import { EventReportValidator } from "../Validator/eventreport.validator";

test.describe("Event Report API", () => {
    test(
        "Validate Event Report API",
        {
            tag: ["@smoke", "@reports", "@event-report"],
        },
        async ({ authenticatedApi }) => {
            const api = new EventReportApi(authenticatedApi);
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new EventReportValidator();

            const { fromDate, toDate, organisationLookupId, limit } =
                EventReportData;

            const { rawResponse, responseBody, responseTime } =
                await api.getEventReport(
                    fromDate,
                    toDate,
                    organisationLookupId,
                    limit,
                );

            await PerformanceTracker.track(
                rawResponse,
                "Event Report API",
                `${process.env.BASE_URL}/indore/reports/event-report?fromDate=${fromDate}&toDate=${toDate}&organisationLookupId=${organisationLookupId}&limit=${limit}`,
                responseTime,
            );

            validation.execute("Status Code", () =>
                assert.validateStatusCode(rawResponse, 200),
            );
            validation.execute("Content Type", () =>
                assert.validateContentType(rawResponse),
            );
            validation.execute("Response Time", () =>
                assert.validateResponseTime(
                    responseTime,
                    EventReportData.maxResponseTime,
                ),
            );
            validation.execute("Sensitive Data", () =>
                assert.validateSensitiveData(responseBody),
            );

            const mapped = EventReportMapper.map(responseBody);
            const data = mapped.data;
            const items = data.items;

            validation.execute("Success", () =>
                validator.validateSuccess(mapped),
            );
            validation.execute("Root Structure", () =>
                validator.validateRootStructure(mapped),
            );
            validation.execute("Query Echo", () =>
                validator.validateQueryEcho(data, fromDate, toDate),
            );
            validation.execute("Date Range Format", () =>
                validator.validateDateRangeFormat(data),
            );
            validation.execute("Scoped Meter Count", () =>
                validator.validateScopedMeterCount(data),
            );
            validation.execute("Applied Filters", () =>
                validator.validateAppliedFilters(data, organisationLookupId),
            );
            validation.execute("Items Limit", () =>
                validator.validateItemsLimit(items, limit),
            );
            validation.execute("No Data Scenario", () =>
                validator.validateNoDataScenario(data),
            );
            validation.execute("Items Present When Scoped", () =>
                validator.validateItemsPresentWhenScoped(data),
            );

            if (items.length > 0) {
                validation.execute("Items Structure", () =>
                    validator.validateItemsStructure(items),
                );
                validation.execute("Circle Field", () =>
                    validator.validateCircleField(items),
                );
                validation.execute("Event Identity", () =>
                    validator.validateEventIdentity(items),
                );
                validation.execute("Event Counts", () =>
                    validator.validateEventCounts(items),
                );
                validation.execute("Duration Format", () =>
                    validator.validateDurationFormat(items),
                );
                validation.execute("Duration Consistency", () =>
                    validator.validateDurationConsistency(items),
                );
                validation.execute("SL No Sequence", () =>
                    validator.validateSlNoSequence(items),
                );
                validation.execute("Unique SL No", () =>
                    validator.validateUniqueSlNo(items),
                );
                validation.execute("Unique Event ID", () =>
                    validator.validateUniqueEventId(items),
                );
                validation.execute("Unique Event Name", () =>
                    validator.validateUniqueEventName(items),
                );
            }

            validation.printSummary("Event Report API", responseTime);
        },
    );
});
