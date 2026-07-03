import { test } from "../../../../src/fixtures/api.fixture";
import { DtrCapacityGaugeApi } from "../Api/dtrcapacitygauge.api";
import { dtrCapacityGaugeData } from "../Data/dtrcapacitygauge.data";
import { DtrCapacityGaugeMapper } from "../Mapper/dtrcapacitygauge.mapper";
import { DtrCapacityGaugeValidator } from "../Validator/dtrcapacitygauge.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("DTR Capacity Gauge API", () => {
    test(
        "Validate DTR Capacity Gauge API",
        {
            tag: ["@dtr", "@capacity-gauge", "@smoke"],
        },
        async ({ authenticatedApi }) => {
            const api = new DtrCapacityGaugeApi(authenticatedApi);
            const { rawResponse, responseBody, responseTime } =
                await api.getCapacityGauge(dtrCapacityGaugeData.dtrCode);

            await PerformanceTracker.track(
                rawResponse,
                "DTR Capacity Gauge API",
                `${process.env.BASE_URL}/indore/dtr/${dtrCapacityGaugeData.dtrCode}/capacity-gauge`,
                responseTime,
            );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new DtrCapacityGaugeValidator();

            // =====================================
            // API VALIDATIONS
            // =====================================
            validation.execute("Status Code", () =>
                assert.validateStatusCode(rawResponse, 200),
            );
            validation.execute("Content Type", () =>
                assert.validateContentType(rawResponse),
            );
            validation.execute("Response Time", () =>
                assert.validateResponseTime(responseTime, 30000),
            );
            validation.execute("Sensitive Data", () =>
                assert.validateSensitiveData(responseBody),
            );
            validation.execute("Required Fields", () =>
                assert.validateRequiredFields(responseBody.data, [
                    "ratedCapacityKva",
                    "bands",
                ]),
            );

            // =====================================
            // MAPPER
            // =====================================
            const mapped = DtrCapacityGaugeMapper.map(responseBody);

            // =====================================
            // BACKEND VALIDATIONS
            // =====================================
            validation.execute("Response Envelope", () =>
                validator.validateResponseEnvelope(responseBody),
            );
            validation.execute("Field Validation", () =>
                validator.validateFields(mapped),
            );
            validation.execute("Rated Capacity", () =>
                validator.validateRatedCapacity(mapped),
            );
            validation.execute("Band Count Validation", () =>
                validator.validateBandCount(mapped.bands),
            );
            validation.execute("Band Structure Validation", () =>
                validator.validateBandStructure(mapped.bands),
            );
            validation.execute("Band Order Validation", () =>
                validator.validateBandOrder(
                    mapped.bands,
                    dtrCapacityGaugeData.expectedBands,
                ),
            );
            validation.execute("Type Validation", () =>
                validator.validateTypes(mapped),
            );
            validation.execute("Unit Validation", () =>
                validator.validateUnits(mapped.bands),
            );
            validation.execute("Percentage Validation", () =>
                validator.validatePercentages(mapped.bands),
            );
            validation.execute("Value Validation", () =>
                validator.validateValues(mapped.bands),
            );
            validation.execute("Capacity Logic Validation", () =>
                validator.validateCapacityLogic(
                    mapped.ratedCapacityKva,
                    mapped.bands,
                ),
            );
            validation.execute("Gauge Percent Formula", () =>
                validator.validateGaugePercentFormula(
                    mapped.ratedCapacityKva,
                    mapped.bands,
                ),
            );
            validation.execute("Rounded Value Validation", () =>
                validator.validateRoundedValues(mapped.bands),
            );
            validation.execute("Zero Fallback State", () =>
                validator.validateZeroFallbackState(mapped),
            );
            validation.execute("NaN Validation", () =>
                validator.validateNaN(mapped),
            );
            validation.execute("Unique Labels Validation", () =>
                validator.validateUniqueLabels(mapped.bands),
            );

            // =====================================
            // SUMMARY
            // =====================================
            validation.printSummary("DTR Capacity Gauge API", responseTime);
        },
    );
});
