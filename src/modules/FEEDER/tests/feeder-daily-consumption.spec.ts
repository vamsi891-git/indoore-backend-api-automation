import { test } from "../../../../src/fixtures/api.fixture";
import { FeederDailyConsumptionApi } from "../Api/feeder-daily-consumption.api";
import { feederDailyConsumptionData } from "../Data/feeder-daily-consumption.data";
import { FeederDailyConsumptionMapper } from "../Mapper/feeder-daily-consumption.mapper";
import { FeederDailyConsumptionValidator } from "../Validator/feeder-daily-consumption.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Feeder Daily Consumption API", () => {
    test(
        "Validate Feeder Daily Consumption API",
        {
            tag: ["@feeder", "@daily-consumption", "@smoke"],
        },
        async ({ authenticatedApi }) => {
            const api = new FeederDailyConsumptionApi(authenticatedApi);
            const {
                feederCode,
                granularity,
                expectedUnit,
                expectedDayPointCount,
                maxResponseTime,
            } = feederDailyConsumptionData;

            const { rawResponse, responseBody, responseTime } =
                await api.getDailyConsumption(feederCode, granularity);

            await PerformanceTracker.track(
                rawResponse,
                "Feeder Daily Consumption API",
                `${process.env.BASE_URL}/indore/feeder/${feederCode}/daily-consumption?granularity=${granularity}`,
                responseTime,
            );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new FeederDailyConsumptionValidator();

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
                    "granularity",
                    "unit",
                    "points",
                ]),
            );

            const mapped = FeederDailyConsumptionMapper.map(responseBody);
            const { points } = mapped;

            validation.execute("Success", () =>
                validator.validateSuccess(mapped.success),
            );
            validation.execute("Root Structure", () =>
                validator.validateRootStructure(mapped),
            );
            validation.execute("Granularity Echo", () =>
                validator.validateGranularityEcho(mapped, granularity),
            );
            validation.execute("Unit", () =>
                validator.validateUnit(mapped, expectedUnit),
            );
            validation.execute("Empty Scenario", () =>
                validator.validateEmptyScenario(mapped),
            );
            validation.execute("Business Rules", () =>
                validator.validateBusinessRules(mapped),
            );
            validation.execute("Day Point Count", () =>
                validator.validateDayPointCount(
                    points,
                    expectedDayPointCount,
                ),
            );

            if (points.length > 0) {
                validation.execute("Point Required Fields", () =>
                    validator.validatePointRequiredFields(points),
                );
                validation.execute("Point Structure", () =>
                    validator.validatePointStructure(points),
                );
                validation.execute("Day Label Format", () =>
                    validator.validateDayLabelFormat(points),
                );
                validation.execute("Day Key Format", () =>
                    validator.validateDayKeyFormat(points),
                );
                validation.execute("Label Key Alignment", () =>
                    validator.validateLabelKeyAlignment(points),
                );
                validation.execute("kWh Values", () =>
                    validator.validateKwhValues(points),
                );
                validation.execute("Unique Keys", () =>
                    validator.validateUniqueKeys(points),
                );
                validation.execute("Chronological Order", () =>
                    validator.validateChronologicalOrder(points),
                );
                validation.execute("Consecutive Days", () =>
                    validator.validateConsecutiveDays(points),
                );
            }

            validation.printSummary("Feeder Daily Consumption API", responseTime);
        },
    );
});
