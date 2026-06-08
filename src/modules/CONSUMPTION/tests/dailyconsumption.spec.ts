import { test } from "../../../../src/fixtures/api.fixture";
import { DailyConsumptionApi } from "../Api/dailyconsumption.api";
import { dailyConsumptionData } from "../Data/dailyconsumption.data";
import { DailyConsumptionMapper } from "../Mapper/dailyconsumption.mapper";
import { DailyConsumptionValidator } from "../Validator/dailyconsumption.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Daily Consumption Report API", () => {
    test(
        "Validate Daily Consumption Report API",
        {
            tag: ["@consumption", "@daily-consumption", "@smoke"],
        },
        async ({ authenticatedApi }) => {
            const api = new DailyConsumptionApi(authenticatedApi);
            const {
                page,
                limit,
                fromDate,
                toDate,
                month,
                year,
                maxResponseTime,
            } = dailyConsumptionData;

            const { rawResponse, responseBody, responseTime } =
                await api.getDailyReport(
                    page,
                    limit,
                    fromDate,
                    toDate,
                    month,
                    year,
                );

            await PerformanceTracker.track(
                rawResponse,
                "Daily Consumption Report API",
                `${process.env.BASE_URL}/indore/consumption/report?reportType=daily&page=${page}&limit=${limit}&fromDate=${fromDate}&toDate=${toDate}&month=${month}&year=${year}`,
                responseTime,
            );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new DailyConsumptionValidator();

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
                    "items",
                    "total",
                    "page",
                    "limit",
                    "totalPages",
                ]),
            );

            const mapped = DailyConsumptionMapper.map(responseBody);
            const { items } = mapped;

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
            validation.execute("Items Present When Total Positive", () =>
                validator.validateItemsPresentWhenTotalPositive(mapped),
            );
            validation.execute("Business Rules", () =>
                validator.validateBusinessRules(mapped),
            );

            if (items.length > 0) {
                validation.execute("Item Required Fields", () =>
                    validator.validateItemRequiredFields(items),
                );
                validation.execute("Item Structure", () =>
                    validator.validateItemStructure(items),
                );
                validation.execute("Serial Sequence", () =>
                    validator.validateSerialSequence(items, mapped.page, mapped.limit),
                );
                validation.execute("Unique Serial Numbers", () =>
                    validator.validateUniqueSerialNumbers(items),
                );
                validation.execute("Reading Date Format", () =>
                    validator.validateReadingDateFormat(items),
                );
                validation.execute("Null Reading Bundle", () =>
                    validator.validateNullReadingBundle(items),
                );
                validation.execute("kWh Derivation", () =>
                    validator.validateKwhDerivation(items),
                );
                validation.execute("Round5 Precision", () =>
                    validator.validateRound5Precision(items),
                );
                validation.execute("Non Negative Readings", () =>
                    validator.validateNonNegativeReadings(items),
                );
                validation.execute("Reading Dates When Present", () =>
                    validator.validateReadingDatesWhenPresent(items),
                );
                validation.execute("MSN When Present", () =>
                    validator.validateMsnWhenPresent(items),
                );
                validation.execute("No NaN", () =>
                    validator.validateNoNaN(items),
                );
            }

            validation.printSummary("Daily Consumption Report API", responseTime);
        },
    );
});
