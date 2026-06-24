import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { ProfileImageApi } from "../Api/profileimage.api";
import { ProfileImageData } from "../Data/profileimage.data";
import { ProfileImageMapper } from "../Mapper/profileimage.mapper";
import { ProfileImageValidator } from "../Validator/profileimage.validator";
import {
    PROFILE_IMAGE_TEST_BYTES,
    putImageToPresignedUrl,
} from "../utils/profileimage-upload.util";

test.describe("User Profile Image Flow", () => {
    test.describe.configure({ mode: "serial" });

    test(
        "Validate profile image upload, save, and delete lifecycle",
        { tag: ["@users-profile-image"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new ProfileImageValidator();
            const profileApi = new ProfileImageApi(authenticatedApi);

            const uploadResponse = await profileApi.getProfileImageUploadUrl(
                ProfileImageData.buildUploadRequest(),
            );
            validation.execute("Upload URL Status Code", () =>
                assert.validateStatusCode(uploadResponse.rawResponse, 200),
            );
            validation.execute("Upload URL Content Type", () =>
                assert.validateContentType(uploadResponse.rawResponse),
            );
            validation.execute("Upload URL Response Time", () =>
                assert.validateResponseTime(
                    uploadResponse.responseTime,
                    ProfileImageData.maxResponseTime,
                ),
            );
            validation.execute("Upload URL Sensitive Data", () =>
                assert.validateSensitiveData(uploadResponse.responseBody),
            );
            validation.execute("Validate Upload URL Root Response", () =>
                validator.validateResponse(uploadResponse.responseBody),
            );

            const uploadData = ProfileImageMapper.mapUploadUrl(
                uploadResponse.responseBody,
            );
            validation.execute("Validate Upload URL Payload", () =>
                validator.validateUploadUrlData(uploadData),
            );

            const s3Upload = await putImageToPresignedUrl(
                uploadData.uploadUrl,
                PROFILE_IMAGE_TEST_BYTES,
                ProfileImageData.contentType,
            );
            validation.execute("S3 Upload Status Code", () => {
                expect(s3Upload.status).toBe(200);
            });

            const saveResponse = await profileApi.saveProfileImage({
                profileImageUrl: uploadData.fileUrl,
                profileImageKey: uploadData.key,
            });
            validation.execute("Save Profile Image Status Code", () =>
                assert.validateStatusCode(
                    saveResponse.rawResponse,
                    200,
                    saveResponse.responseBody,
                ),
            );
            validation.execute("Save Profile Image Content Type", () =>
                assert.validateContentType(saveResponse.rawResponse),
            );

            const saved = ProfileImageMapper.mapUserMutation(
                saveResponse.responseBody,
            );
            validation.execute("Save Success Message", () =>
                validator.validateSuccessMessage(
                    saved.message,
                    ProfileImageData.updatedMessage,
                ),
            );
            validation.execute("Validate Saved User Identity", () =>
                validator.validateUserIdentity(saved.user),
            );
            validation.execute("Validate Profile Image Saved", () =>
                validator.validateProfileImageSaved(
                    saved.user,
                    uploadData.fileUrl,
                    uploadData.key,
                ),
            );

            const deleteResponse = await profileApi.deleteProfileImage();
            validation.execute("Delete Profile Image Status Code", () =>
                assert.validateStatusCode(
                    deleteResponse.rawResponse,
                    200,
                    deleteResponse.responseBody,
                ),
            );

            const removed = ProfileImageMapper.mapUserMutation(
                deleteResponse.responseBody,
            );
            validation.execute("Delete Success Message", () =>
                validator.validateSuccessMessage(
                    removed.message,
                    ProfileImageData.removedMessage,
                ),
            );
            validation.execute("Validate Profile Image Removed", () =>
                validator.validateProfileImageRemoved(removed.user),
            );

            await PerformanceTracker.track(
                uploadResponse.rawResponse,
                "Profile Image Upload URL",
                uploadResponse.rawResponse.url(),
                uploadResponse.responseTime,
            );
            await PerformanceTracker.track(
                saveResponse.rawResponse,
                "Profile Image Save",
                saveResponse.rawResponse.url(),
                saveResponse.responseTime,
            );
            await PerformanceTracker.track(
                deleteResponse.rawResponse,
                "Profile Image Delete",
                deleteResponse.rawResponse.url(),
                deleteResponse.responseTime,
            );

            assert.assertValidationResults(validation.getResults());

            validation.printSummary(
                "User Profile Image Module",
                uploadResponse.responseTime +
                    saveResponse.responseTime +
                    deleteResponse.responseTime,
            );
        },
    );
});
