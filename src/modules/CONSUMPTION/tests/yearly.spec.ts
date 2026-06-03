import { test } from "../../../../src/fixtures/api.fixture";
import { PatternConsumptionApi } from "../Api/patternconsumption.api";
import { patternConsumptionData } from "../Data/patternconsumption.data";
import { PatternConsumptionMapper } from "../Mapper/patternconsumption.mapper";
import { PatternConsumptionValidator } from "../Validator/patternconsumption.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Pattern Consumption Yearly API", () => {
    test("Validate Pattern Consumption Yearly API",
        {
            tag: [
                "@consumption",
                "@yearly",
                "@smoke"
            ]
        },
        async ({ authenticatedApi }) => {
            const api = new PatternConsumptionApi(authenticatedApi);
            const {
                rawResponse,
                responseBody,
                responseTime
            } = await api.getPatternConsumption(
                patternConsumptionData.yearlyType,
                patternConsumptionData.page,
                patternConsumptionData.limit,
                patternConsumptionData.month,
                patternConsumptionData.year
            );
            await PerformanceTracker.track(
                rawResponse,
                "Pattern Consumption Yearly API",
                `${process.env.BASE_URL}/indore/consumption/pattern-consumption`,
                responseTime
            );
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();

            validation.execute("Status Code", () =>
                assert.validateStatusCode(rawResponse, 200)
            );
            validation.execute("Content Type", () =>
                assert.validateContentType(rawResponse)
            );
            validation.execute("Response Time", () =>
                assert.validateResponseTime(responseTime, patternConsumptionData.maxResponseTime)
            );
            validation.execute("Sensitive Data", () =>
                assert.validateSensitiveData(responseBody)
            );
            const mapped = PatternConsumptionMapper.map(responseBody);
            const validator = new PatternConsumptionValidator();

            validation.execute("Table Validation", () =>
                validator.validateTable(mapped)
            );
            validation.execute("Rows Validation", () =>
                validator.validateRows(mapped.rows)
            );
            validation.execute("SLNO Validation", () =>
                validator.validateSlNo(mapped.rows)
            );
            validation.execute("Required Fields", () =>
                validator.validateRequiredFields(mapped.rows)
            );
            validation.execute("Phase Validation", () =>
                validator.validatePhase(
                    mapped.rows,
                    patternConsumptionData.allowedPhases
                )
            );
            validation.execute("Yearly Validation", () =>
                validator.validateYearly(mapped.rows)
            );
            validation.execute("Yearly Total Validation", () =>
                validator.validateYearlyTotal(mapped.rows)
            );
            validation.execute("NaN Validation", () =>
                validator.validateNoNaN(mapped.rows)
            );
            validation.printSummary(
                "Pattern Consumption Yearly API",
                responseTime
            );
        }
    );
});
