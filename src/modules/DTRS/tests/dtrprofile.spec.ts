import { test } from "../../../../src/fixtures/api.fixture";
import { DtrProfileApi } from "../Api/dtrprofile.api";
import { dtrProfileData } from "../Data/dtrprofile.data";
import { DtrProfileMapper } from "../Mapper/dtrprofile.mapper";
import { DtrProfileValidator } from "../Validator/dtrprofile.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("DTR Profile API", () => {
    test(
        "Validate DTR Profile API",
        {
            tag: ["@dtr", "@profile", "@smoke"],
        },
        async ({ authenticatedApi }) => {
            const api = new DtrProfileApi(authenticatedApi);
            const { rawResponse, responseBody, responseTime } =
                await api.getProfile(dtrProfileData.dtrCode);

            await PerformanceTracker.track(
                rawResponse,
                "DTR Profile API",
                `${process.env.BASE_URL}/indore/dtr/${dtrProfileData.dtrCode}/profile`,
                responseTime,
            );

            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new DtrProfileValidator();

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
                    "profileInformation",
                    "hierarchy",
                    "latestActivities",
                ]),
            );

            // =====================================
            // MAPPER
            // =====================================
            const mapped = DtrProfileMapper.map(responseBody);

            // =====================================
            // BACKEND VALIDATIONS
            // =====================================
            validation.execute("Response Envelope", () =>
                validator.validateResponseEnvelope(responseBody),
            );
            validation.execute("Field Validation", () =>
                validator.validateFields(mapped),
            );
            validation.execute("Profile Field Count", () =>
                validator.validateProfileFieldCount(mapped.profileInformation),
            );
            validation.execute("Profile Title Validation", () =>
                validator.validateProfileTitles(
                    mapped.profileInformation,
                    dtrProfileData.expectedProfileTitles,
                ),
            );
            validation.execute("Profile Structure Validation", () =>
                validator.validateProfileStructure(mapped.profileInformation),
            );
            validation.execute("DTR Number Validation", () =>
                validator.validateDtrNumber(
                    mapped.profileInformation,
                    dtrProfileData.dtrCode,
                ),
            );
            validation.execute("DTR Name Validation", () =>
                validator.validateDtrName(mapped.profileInformation),
            );
            validation.execute("Hierarchy Structure Validation", () =>
                validator.validateHierarchyStructure(mapped.hierarchy),
            );
            validation.execute("Hierarchy Order Validation", () =>
                validator.validateHierarchyOrder(mapped.hierarchy),
            );
            validation.execute("Hierarchy Profile Consistency", () =>
                validator.validateHierarchyProfileConsistency(
                    mapped.profileInformation,
                    mapped.hierarchy,
                ),
            );
            validation.execute("Activities Structure Validation", () =>
                validator.validateActivitiesStructure(mapped.latestActivities),
            );
            validation.execute("Activities Limit Validation", () =>
                validator.validateActivitiesLimit(mapped.latestActivities),
            );
            validation.execute("Activity Title Validation", () =>
                validator.validateActivityTitles(mapped.latestActivities),
            );
            validation.execute("Coordinate Validation", () =>
                validator.validateCoordinates(mapped.profileInformation),
            );
            validation.execute("Capacity Format Validation", () =>
                validator.validateCapacityFormat(mapped.profileInformation),
            );
            validation.execute("Meter Serial Validation", () =>
                validator.validateMeterSerial(mapped.profileInformation),
            );
            validation.execute("Empty String Validation", () =>
                validator.validateEmptyStrings(mapped.profileInformation),
            );
            validation.execute("Unique Title Validation", () =>
                validator.validateUniqueTitles(mapped.profileInformation),
            );
            validation.execute("MF Validation", () =>
                validator.validateMF(mapped.profileInformation),
            );
            validation.execute("Unique Hierarchy Validation", () =>
                validator.validateUniqueHierarchy(mapped.hierarchy),
            );

            // =====================================
            // SUMMARY
            // =====================================
            validation.printSummary("DTR Profile API", responseTime);
        },
    );
});
