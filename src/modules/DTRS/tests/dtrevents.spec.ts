import { test } from "../../../../src/fixtures/api.fixture";
import { DtrEventsApi } from "../Api/dtrevents.api";
import { dtrEventsData } from "../Data/dtrevents.data";
import { DtrEventsMapper } from "../Mapper/dtrevents.mapper";
import { DtrEventsValidator } from "../Validator/dtrevents.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("DTR Events API", () => {
    test(
        "Validate DTR Events API",
        {
            tag: ["@dtr", "@dtr-events", "@smoke"],
        },
        async ({ authenticatedApi }) => {
            const api = new DtrEventsApi(authenticatedApi);
            const { dtrCode, page, limit, maxResponseTime } = dtrEventsData;

            const { rawResponse, responseBody, responseTime } =
                await api.getEvents(dtrCode, page, limit);

            await PerformanceTracker.track(
                rawResponse,
                "DTR Events API",
                `${process.env.BASE_URL}/indore/dtr/${dtrCode}/events?page=${page}&limit=${limit}`,
                responseTime,
            );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new DtrEventsValidator();

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

            const mapped = DtrEventsMapper.map(responseBody);
            const { rows } = mapped;

            validation.execute("Success", () =>
                validator.validateSuccess(mapped.success),
            );
            validation.execute("Root Structure", () =>
                validator.validateRootStructure(mapped),
            );
            validation.execute("Query Echo", () =>
                validator.validateQueryEcho(mapped, page, limit),
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
                validation.execute("Meter SL No", () =>
                    validator.validateMeterSlNo(rows),
                );
                validation.execute("Meter SL No Consistency", () =>
                    validator.validateMeterSlNoConsistency(rows),
                );
                validation.execute("Description", () =>
                    validator.validateDescription(rows),
                );
                validation.execute("Date Time Format", () =>
                    validator.validateDateTimeFormat(rows),
                );
                validation.execute("Duration Format", () =>
                    validator.validateDurationFormat(rows),
                );
                validation.execute("Restore After Occurrence", () =>
                    validator.validateRestoreAfterOccurrence(rows),
                );
                validation.execute("Chronological Order", () =>
                    validator.validateChronologicalOrder(rows),
                );
            }

            validation.printSummary("DTR Events API", responseTime);
        },
    );
});
