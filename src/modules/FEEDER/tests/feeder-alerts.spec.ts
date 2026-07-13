import { test } from "../../../../src/fixtures/api.fixture";
import { FeederAlertsApi } from "../Api/feeder-alerts.api";
import { feederAlertsData } from "../Data/feeder-alerts.data";
import { FeederAlertsMapper } from "../Mapper/feeder-alerts.mapper";
import { FeederAlertsValidator } from "../Validator/feeder-alerts.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Feeder Alerts API", () => {
    test(
        "Validate Feeder Alerts API",
        {
            tag: ["@feeder", "@feeder-alerts", "@smoke"],
        },
        async ({ authenticatedApi }) => {
            const api = new FeederAlertsApi(authenticatedApi);
            const { feederCode, page, limit, maxResponseTime } =
                feederAlertsData;

            const { rawResponse, responseBody, responseTime } =
                await api.getAlerts(feederCode, page, limit);

            await PerformanceTracker.track(
        rawResponse,
        "Feeder Alerts API",
        rawResponse.url(),
        responseTime
      );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new FeederAlertsValidator();

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

            const mapped = FeederAlertsMapper.map(responseBody);
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
                validation.execute("Meter Number", () =>
                    validator.validateMeterNumber(rows),
                );
                validation.execute("Event Type", () =>
                    validator.validateEventType(rows),
                );
                validation.execute("Occurred On Format", () =>
                    validator.validateOccurredOnFormat(rows),
                );
                validation.execute("Duration Format", () =>
                    validator.validateDurationFormat(rows),
                );
                validation.execute("Chronological Order", () =>
                    validator.validateChronologicalOrder(rows),
                );
            }

            validation.printSummary("Feeder Alerts API", responseTime);
        },
    );
});
