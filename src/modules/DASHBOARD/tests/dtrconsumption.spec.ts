import { test } from "../../../../src/fixtures/api.fixture";
import { DtrConsumptionApi } from "../Api/dtrconsumption.api";
import { DtrConsumptionMapper } from "../Mapper/dtrconsumption.mapper";
import { DtrConsumptionValidator } from "../Validator/dtrconsumption.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";

test.describe("DTR Consumption API", () => {

    test(
        "Validate DTR Consumption API",
        {
            tag: [
                "@dashboard",
                "@smoke"
            ]
        },
        async ({ authenticatedApi }) => {

            const api = new DtrConsumptionApi(authenticatedApi);

            const {
                rawResponse,
                responseBody,
                responseTime
            } = await api.getDtrConsumption();

            await PerformanceTracker.track(
                rawResponse,
                "DTR Consumption API",
                `${process.env.BASE_URL}/indore/dashboard/dtr/consumption`,
                responseTime
            );

            const assertion = new AssertionEngine();
            const validation = new ValidationEngine();

            validation.execute(
                "Status Code",
                () => assertion.validateStatusCode(rawResponse, 200)
            );

            validation.execute(
                "Content Type",
                () => assertion.validateContentType(rawResponse)
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
                () => assertion.validateSensitiveData(responseBody)
            );

            const data =
                DtrConsumptionMapper.mapData(responseBody);

            const validator =
                new DtrConsumptionValidator();

            validation.execute(
                "Period",
                () => validator.validatePeriod(data)
            );

            validation.execute(
                "Point Count",
                () => validator.validatePointCount(data)
            );

            validation.execute(
                "Points",
                () => validator.validatePoints(data)
            );

            validation.execute(
                "Unique Labels",
                () => validator.validateUniqueLabels(data)
            );

            validation.execute(
                "Totals",
                () => validator.validateTotals(data)
            );

            validation.execute(
                "kVAh vs kWh",
                () => validator.validateKvahVsKwh(data)
            );

            validation.printSummary(
                "DTR Consumption API",
                responseTime
            );
        }
    );
});