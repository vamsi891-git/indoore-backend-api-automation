import { test } from "../../../../src/fixtures/api.fixture";
import { DtrCommunicationApi } from "../Api/dtrcommunication.api";
import { DtrCommunicationData } from "../Data/dtrcommunication.data";
import { DtrCommunicationMapper } from "../Mapper/dtrcommunication.mapper";
import { DtrCommunicationValidator } from "../Validator/dtrcommunication.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../../src/core/utils/performancetracker";

test.describe("DTR Communication API", () => {

    test(
        "Validate DTR Communication API",
        {
            tag: [
                "@smoke",
                "@dashboard"
            ]
        },
        async ({ authenticatedApi }) => {

            const api = new DtrCommunicationApi(authenticatedApi);

            const {
                rawResponse,
                responseBody,
                responseTime
            } = await api.getDtrCommunicationStatus(
                DtrCommunicationData.page,
                DtrCommunicationData.limit
            );

            await PerformanceTracker.track(
                rawResponse,
                "DTR Communication API",
                `${process.env.BASE_URL}/indore/dashboard/dtr/communication-status?page=${DtrCommunicationData.page}&limit=${DtrCommunicationData.limit}`,
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
                DtrCommunicationMapper.mapdata(responseBody);

            const validator =
                new DtrCommunicationValidator();

            validation.execute(
                "Period",
                () => validator.validatePeriod(data)
            );

            validation.execute(
                "Point Count",
                () => validator.validatePointCount(data)
            );

            validation.execute(
                "Points Validation",
                () => validator.validatePoints(data)
            );

            validation.execute(
                "Unique Labels",
                () => validator.validateUniqueLabels(data)
            );

            validation.execute(
                "Totals Validation",
                () => validator.validateTotals(data)
            );

            validation.execute(
                "Communication Status",
                () => validator.validateCommunicationStatus(data)
            );

            validation.printSummary(
                "DTR Communication API",
                responseTime
            );
        }
    );
});