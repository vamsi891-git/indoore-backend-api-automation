import { test } from "../../../../src/fixtures/api.fixture";
import { EventLogListApi } from "../Api/eventloglist.api";
import { eventLogListData } from "../Data/eventloglist.data";
import { EventLogListMapper } from "../Mapper/eventloglist.mapper";
import { EventLogListValidator } from "../Validator/eventloglist.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";

test.describe("Event Log List API", () => {
    test(
        "Validate Event Log List API",
        {
            tag: ["@consumer", "@event-log", "@event-log-list", "@smoke"],
        },
        async ({ authenticatedApi }) => {
            const api = new EventLogListApi(authenticatedApi);
            const { consumerNumber, eventPage, eventPageSize, maxResponseTime } =
                eventLogListData;

            const { rawResponse, responseBody, responseTime } =
                await api.getEventLogList(
                    consumerNumber,
                    eventPage,
                    eventPageSize,
                );

            await PerformanceTracker.track(
                rawResponse,
                "Event Log List API",
                `${process.env.BASE_URL}/indore/consumers/${consumerNumber}/event-log/list?eventPage=${eventPage}&eventPageSize=${eventPageSize}`,
                responseTime,
            );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new EventLogListValidator();

            validation.execute("Status", () =>
                assert.validateStatusCode(rawResponse, 200, responseBody),
            );
            validation.execute("Content Type", () =>
                assert.validateContentType(rawResponse),
            );
            validation.execute("Response Time", () =>
                assert.validateResponseTime(responseTime, maxResponseTime),
            );
            validation.execute("Sensitive Data", () =>
                assert.validateSensitiveData(responseBody),
            );
            validation.execute("Required Fields", () =>
                assert.validateRequiredFields(responseBody.data, [
                    "rows",
                    "page",
                    "pageSize",
                    "totalCount",
                    "totalPages",
                ]),
            );

            const mapped = EventLogListMapper.map(responseBody);
            const { rows } = mapped;

            validation.execute("Success", () =>
                validator.validateSuccess(mapped.success),
            );
            validation.execute("Root Structure", () =>
                validator.validateRootStructure(mapped),
            );
            validation.execute("Query Echo", () =>
                validator.validateQueryEcho(mapped, eventPage, eventPageSize),
            );
            validation.execute("Pagination Bounds", () =>
                validator.validatePaginationBounds(mapped),
            );
            validation.execute("Pagination Math", () =>
                validator.validatePaginationMath(mapped),
            );
            validation.execute("Empty Scenario", () =>
                validator.validateEmptyScenario(mapped),
            );
            validation.execute("Rows Present When Total Positive", () =>
                validator.validateRowsPresentWhenTotalPositive(mapped),
            );
            validation.execute("Business Rules", () =>
                validator.validateBusinessRules(mapped),
            );

            if (rows.length > 0) {
                validation.execute("Data Present Pagination", () =>
                    validator.validateDataPresentPagination(mapped),
                );
                validation.execute("Row Required Fields", () =>
                    validator.validateRowRequiredFields(rows),
                );
                validation.execute("Row Structure", () =>
                    validator.validateRowStructure(rows),
                );
                validation.execute("Serial Sequence", () =>
                    validator.validateSerialSequence(
                        rows,
                        mapped.page,
                        mapped.pageSize,
                    ),
                );
                validation.execute("Unique Serial Numbers", () =>
                    validator.validateUniqueSerialNumbers(rows),
                );
                validation.execute("Status Rules", () =>
                    validator.validateStatusRules(rows),
                );
                validation.execute("Status Distribution", () =>
                    validator.validateStatusDistribution(rows),
                );
                validation.execute("Meter No", () =>
                    validator.validateMeterNo(rows),
                );
                validation.execute("Meter No Consistency", () =>
                    validator.validateMeterNoConsistency(rows),
                );
                validation.execute("Description", () =>
                    validator.validateDescription(rows),
                );
                validation.execute("Date Time Format", () =>
                    validator.validateDateTimeFormat(rows),
                );
                validation.execute("Duration Display Format", () =>
                    validator.validateDurationDisplayFormat(rows),
                );
                validation.execute("Restore After Occurrence", () =>
                    validator.validateRestoreAfterOccurrence(rows),
                );
                validation.execute("Chronological Order", () =>
                    validator.validateChronologicalOrder(rows),
                );
            }

            validation.printSummary("Event Log List API", responseTime);
        },
    );
});
