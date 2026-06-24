import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { ProfileImageApi } from "../Api/profileimage.api";
import { ProfileImageData } from "../Data/profileimage.data";
import { ProfileImageMapper } from "../Mapper/profileimage.mapper";
import { ProfileImageValidator } from "../Validator/profileimage.validator";

test.describe("User Profile Image — List", () => {
    test(
        "Validate POST /users/me/profile-image/upload-url — presigned upload contract",
        { tag: ["@smoke", "@users-profile-image"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new ProfileImageValidator();
            const profileApi = new ProfileImageApi(authenticatedApi);

            const response = await profileApi.getProfileImageUploadUrl(
                ProfileImageData.buildUploadRequest(),
            );

            validation.execute("Upload URL Status Code", () =>
                assert.validateStatusCode(response.rawResponse, 200),
            );
            validation.execute("Upload URL Content Type", () =>
                assert.validateContentType(response.rawResponse),
            );
            validation.execute("Upload URL Response Time", () =>
                assert.validateResponseTime(
                    response.responseTime,
                    ProfileImageData.maxResponseTime,
                ),
            );
            validation.execute("Upload URL Sensitive Data", () =>
                assert.validateSensitiveData(response.responseBody),
            );

            await PerformanceTracker.track(
                response.rawResponse,
                "Profile Image Upload URL",
                response.rawResponse.url(),
                response.responseTime,
            );

            validation.execute("Validate Root Response", () =>
                validator.validateResponse(response.responseBody),
            );

            const uploadData = ProfileImageMapper.mapUploadUrl(
                response.responseBody,
            );
            validation.execute("Validate Upload URL Payload", () =>
                validator.validateUploadUrlData(uploadData),
            );

            validation.printSummary("Profile Image Upload URL", response.responseTime);
        },
    );
});
