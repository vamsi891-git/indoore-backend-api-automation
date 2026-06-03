import { test } from "../../../../src/fixtures/api.fixture";
import { DtrSummaryApi } from "../Api/dtrsummary.api";
import { DtrsSummaryData } from "../Data/dtrssummary.data";
import { DtrSummaryMapper } from "../Mapper/dtrsummary.mapper";
import { DtrSummaryValidator } from "../Validator/dtrsummary.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("DTR Summary API", () => {

    test(
        "Validate DTR Summary API",
        {
            tag: [
                "@dashboard",
                "@smoke"
            ]
        },
        async ({ authenticatedApi }) => {

            const api =
                new DtrSummaryApi(authenticatedApi);

            const {
                rawResponse,
                responseBody,
                responseTime
            } =
                await api.getDtrSummary(
                    DtrsSummaryData.page,
                    DtrsSummaryData.limit
                );

            await PerformanceTracker.track(
                rawResponse,
                "DTR Summary API",
                `${process.env.BASE_URL}/indore/dashboard/dtr/summary?page=${DtrsSummaryData.page}&limit=${DtrsSummaryData.limit}`,
                responseTime
            );

            const assertion =
                new AssertionEngine();

            const validation =
                new ValidationEngine();

            validation.execute(
                "Status",
                () => assertion.validateStatusCode(
                    rawResponse,
                    200
                )
            );

            validation.execute(
                "Content Type",
                () => assertion.validateContentType(
                    rawResponse
                )
            );

            validation.execute(
                "Response Time",
                () => assertion.validateResponseTime(
                    responseTime,
                    60000
                )
            );

            validation.execute(
                "Security",
                () => assertion.validateSensitiveData(
                    responseBody
                )
            );

            const data =
                DtrSummaryMapper.mapData(
                    responseBody
                );

            const validator =
                new DtrSummaryValidator();

            validation.execute(
                "Period",
                () => validator.validatePeriod(data)
            );

            validation.execute(
                "Counts",
                () => validator.validateCounts(data)
            );

            validation.execute(
                "Labels",
                () => validator.validateLabels(data)
            );

            validation.execute(
                "Trend Lengths",
                () => validator.validateTrendLengths(data)
            );

            validation.execute(
                "On Off Logic",
                () => validator.validateOnOffLogic(data)
            );

            validation.execute(
                "Trend Values",
                () => validator.validateTrendValues(data)
            );

            validation.execute(
                "Trend Data Types",
                () => validator.validateTrendDataTypes(data)
            );

            validation.execute(
                "Off Scenario",
                () => validator.validateOffScenario(data)
            );

            validation.execute(
                "On Scenario",
                () => validator.validateOnScenario(data)
            );

            validation.execute(
                "Alert Scenario",
                () => validator.validateAlertScenario(data)
            );

            validation.execute(
                "Latest Trend",
                () => validator.validateLatestTrend(data)
            );

            validation.printSummary(
                "DTR Summary API",
                responseTime
            );
        }
    );
});