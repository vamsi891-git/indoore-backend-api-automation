import { test } from "../../../../src/fixtures/api.fixture";
import { DtrFeedersApi } from "../Api/dtrfeeders.api";
import { dtrFeedersData } from "../Data/dtrfeeders.data";
import { DtrFeedersMapper } from "../Mapper/dtrfeeders.mapper";
import { DtrFeedersValidator } from "../Validator/dtrfeeders.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("DTR Feeders API", () => {
    test(
        "Validate DTR Feeders API",
        {
            tag: ["@dtr", "@feeders", "@smoke"],
        },
        async ({ authenticatedApi }) => {
            const api = new DtrFeedersApi(authenticatedApi);
            const { rawResponse, responseBody, responseTime } =
                await api.getFeeders(dtrFeedersData.dtrCode);

            await PerformanceTracker.track(
                rawResponse,
                "DTR Feeders API",
                `${process.env.BASE_URL}/indore/dtr/${dtrFeedersData.dtrCode}/feeders`,
                responseTime,
            );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new DtrFeedersValidator();

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
                assert.validateRequiredFields(responseBody.data, ["feeders"]),
            );

            // =====================================
            // MAPPER
            // =====================================
            const mapped = DtrFeedersMapper.map(responseBody);

            // =====================================
            // BACKEND VALIDATIONS
            // =====================================
            validation.execute("Response Envelope", () =>
                validator.validateResponseEnvelope(responseBody),
            );
            validation.execute("Field Validation", () =>
                validator.validateFields(mapped),
            );
            validation.execute("Feeders Array Validation", () =>
                validator.validateFeedersArray(mapped.feeders),
            );
            validation.execute("Feeder Structure Validation", () =>
                validator.validateFeederStructure(mapped.feeders),
            );
            validation.execute("Status Validation", () =>
                validator.validateStatuses(
                    mapped.feeders,
                    dtrFeedersData.allowedStatuses,
                ),
            );
            validation.execute("Feeder ID Validation", () =>
                validator.validateFeederIds(mapped.feeders),
            );
            validation.execute("Last Communication Always Null", () =>
                validator.validateLastCommunicationAlwaysNull(mapped.feeders),
            );
            validation.execute("Unique ID Validation", () =>
                validator.validateUniqueIds(mapped.feeders),
            );
            validation.execute("Feeder Order Validation", () =>
                validator.validateFeederOrder(mapped.feeders),
            );
            validation.execute("Empty Status Validation", () =>
                validator.validateEmptyStatus(mapped.feeders),
            );

            // =====================================
            // SUMMARY
            // =====================================
            validation.printSummary("DTR Feeders API", responseTime);
        },
    );
});
