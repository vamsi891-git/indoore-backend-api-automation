import { test } from "../../../../src/fixtures/api.fixture";
import { DtrPowerStatusApi } from "../Api/dtrpowerstatus.api";
import { DtrPowerStatusData } from "../Data/dtrpowerstatus.data";
import { DtrPowerStatusMapper } from "../Mapper/dtrpowerstatus.mapper";
import { DtrPowerStatusValidator } from "../Validator/dtrpowerstatus.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";

test.describe("DTR Power Status API", () => {

    test(
        "Validate DTR Power Status API",
        {
            tag: [
                "@dashboard",
                "@smoke"
            ]
        },
        async ({ authenticatedApi }) => {

            const api =
                new DtrPowerStatusApi(
                    authenticatedApi
                );

            const {
                rawResponse,
                responseBody,
                responseTime
            } =
                await api.getDtrPowerStatus();

            await PerformanceTracker.track(
                rawResponse,
                "DTR Power Status API",
                `${process.env.BASE_URL}/indore/dashboard/dtr/power-status`,
                responseTime
            );

            const assert =
                new AssertionEngine();

            const validation =
                new ValidationEngine();

            validation.execute(
                "Status",
                () =>
                    assert.validateStatusCode(
                        rawResponse,
                        200
                    )
            );

            validation.execute(
                "Content",
                () =>
                    assert.validateContentType(
                        rawResponse
                    )
            );

            validation.execute(
                "Response Time",
                () =>
                    assert.validateResponseTime(
                        responseTime,
                        60000
                    )
            );

            validation.execute(
                "Security",
                () =>
                    assert.validateSensitiveData(
                        responseBody
                    )
            );

            const data =
                DtrPowerStatusMapper.mapData(
                    responseBody
                );

            const validator =
                new DtrPowerStatusValidator();

            validation.execute(
                "Period",
                () =>
                    validator.validatePeriod(
                        data
                    )
            );

            const expectedPointCount =
                data.period === "daily"
                    ? DtrPowerStatusData.expectedDayCount
                    : DtrPowerStatusData.expectedMonthCount;

            validation.execute(
                "Point Count",
                () =>
                    validator.validatePointCount(
                        data,
                        expectedPointCount
                    )
            );

            validation.execute(
                "Points",
                () =>
                    validator.validatePoints(
                        data
                    )
            );

            validation.execute(
                "Percentage Math",
                () =>
                    validator.validatePercentageMath(
                        data
                    )
            );

            validation.execute(
                "Percentage Total",
                () =>
                    validator.validatePercentageTotal(
                        data
                    )
            );

            validation.execute(
                "Latest Point",
                () =>
                    validator.validateLatestPoint(
                        data
                    )
            );

            validation.execute(
                "No Negative Values",
                () =>
                    validator.validateNoNegativeValues(
                        data
                    )
            );

            validation.execute(
                "Data Consistency",
                () =>
                    validator.validateDataConsistency(
                        data
                    )
            );

            validation.printSummary(
                "DTR Power Status API",
                responseTime
            );
        }
    );
});