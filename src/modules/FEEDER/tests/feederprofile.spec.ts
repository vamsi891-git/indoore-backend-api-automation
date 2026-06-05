import { test } from "../../../../src/fixtures/api.fixture";
import { FeederProfileApi } from "../Api/feederprofile.api";
import { feederProfileData } from "../Data/feederprofile.data";
import { FeederProfileMapper } from "../Mapper/feederprofile.mapper";
import { FeederProfileValidator } from "../Validator/feederprofile.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Feeder Profile API", () => {
    test("Validate Feeder Profile API",
        {
            tag: ["@feeder", "@profile", "@smoke"]
        },
        async ({ authenticatedApi }) => {
            const api = new FeederProfileApi(authenticatedApi);
            const { rawResponse, responseBody, responseTime } =
                await api.getFeederProfile(feederProfileData.feederCode);
            await PerformanceTracker.track(
                rawResponse,
                "Feeder Profile API",
                `${process.env.BASE_URL}/indore/feeder/${feederProfileData.feederCode}/profile`,
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
                assert.validateResponseTime(responseTime, 30000)
            );
            validation.execute("Sensitive Data", () =>
                assert.validateSensitiveData(responseBody)
            );
            const mapped = FeederProfileMapper.map(responseBody);
            const validator = new FeederProfileValidator();
            validation.execute("Success Flag Validation", () =>
                validator.validateSuccess(responseBody)
            );
            validation.execute("Response Data Validation", () =>
                validator.validateResponseData(responseBody)
            );
            validation.execute("Field Validation", () =>
                validator.validateFields(mapped)
            );
            validation.execute("Feeder Code Validation", () =>
                validator.validateFeederCode(mapped, feederProfileData.feederCode)
            );
            validation.execute("Overview Count Validation", () =>
                validator.validateOverviewCount(mapped.overview)
            );
            validation.execute("Overview Structure Validation", () =>
                validator.validateOverviewStructure(mapped.overview)
            );
            validation.execute("Overview Order Validation", () =>
                validator.validateOverviewOrder(
                    mapped.overview,
                    feederProfileData.expectedOverviewTitles
                )
            );
            validation.execute("Type Validation", () =>
                validator.validateTypes(mapped)
            );
            validation.execute("Status Validation", () =>
                validator.validateStatus(mapped)
            );
            validation.execute("Parent DTR Validation", () =>
                validator.validateParentDtr(mapped)
            );
            validation.execute("Feeder Status Logic Validation", () =>
                validator.validateFeederStatusLogic(mapped)
            );
            validation.execute("DTR Number Logic Validation", () =>
                validator.validateDtrNumberLogic(mapped)
            );
            validation.execute("Capacity Logic Validation", () =>
                validator.validateCapacityLogic(mapped)
            );
            validation.execute("Unique Titles Validation", () =>
                validator.validateUniqueTitles(mapped.overview)
            );
            validation.execute("NaN Validation", () =>
                validator.validateNaN(mapped)
            );
            validation.printSummary("Feeder Profile API", responseTime);
        }
    );
});
