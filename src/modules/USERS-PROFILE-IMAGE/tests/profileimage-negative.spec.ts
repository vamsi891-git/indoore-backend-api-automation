import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ProfileImageApi } from "../Api/profileimage.api";
import { ProfileImageData } from "../Data/profileimage.data";
import { ProfileImageValidator } from "../Validator/profileimage.validator";

test.describe("User Profile Image — Negative", () => {
    test.describe.configure({ mode: "serial" });

    test(
        "POST /users/me/profile-image/upload-url — missing fileName returns 400",
        { tag: ["@negative", "@users-profile-image"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new ProfileImageValidator();
            const profileApi = new ProfileImageApi(authenticatedApi);

            const { rawResponse, responseBody, responseTime } =
                await profileApi.getProfileImageUploadUrl(
                    ProfileImageData.uploadMissingFileNamePayload,
                );

            validation.execute("Status (missing fileName)", () =>
                assert.validateStatusCode(rawResponse, 400, responseBody),
            );
            validation.execute("Error envelope", () =>
                validator.validateErrorResponse(rawResponse.status(), responseBody, [
                    400,
                ]),
            );

            validation.printSummary(
                "Upload URL — Missing fileName",
                responseTime,
            );
        },
    );

    test(
        "POST /users/me/profile-image/upload-url — missing fileSize returns 400",
        { tag: ["@negative", "@users-profile-image"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new ProfileImageValidator();
            const profileApi = new ProfileImageApi(authenticatedApi);

            const { rawResponse, responseBody, responseTime } =
                await profileApi.getProfileImageUploadUrl(
                    ProfileImageData.uploadMissingFileSizePayload,
                );

            validation.execute("Status (missing fileSize)", () =>
                assert.validateStatusCode(rawResponse, 400, responseBody),
            );
            validation.execute("Error envelope", () =>
                validator.validateErrorResponse(rawResponse.status(), responseBody, [
                    400,
                ]),
            );

            validation.printSummary(
                "Upload URL — Missing fileSize",
                responseTime,
            );
        },
    );

    test(
        "PATCH /users/me/profile-image — invalid profileImageUrl returns 400",
        { tag: ["@negative", "@users-profile-image"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new ProfileImageValidator();
            const profileApi = new ProfileImageApi(authenticatedApi);

            const { rawResponse, responseBody, responseTime } =
                await profileApi.saveProfileImage(
                    ProfileImageData.invalidSavePayload,
                );

            validation.execute("Status (invalid url)", () =>
                assert.validateStatusCode(rawResponse, 400, responseBody),
            );
            validation.execute("Error envelope", () =>
                validator.validateErrorResponse(rawResponse.status(), responseBody, [
                    400,
                ]),
            );

            validation.printSummary("Save Profile Image — Invalid URL", responseTime);
        },
    );

    test(
        "PATCH /users/me/profile-image — empty body returns 400",
        { tag: ["@negative", "@users-profile-image"] },
        async ({ authenticatedApi }) => {
            const assert = new AssertionEngine();
            const validation = new ValidationEngine();
            const validator = new ProfileImageValidator();
            const profileApi = new ProfileImageApi(authenticatedApi);

            const { rawResponse, responseBody, responseTime } =
                await profileApi.saveProfileImage(ProfileImageData.emptySavePayload);

            validation.execute("Status (empty body)", () =>
                assert.validateStatusCode(rawResponse, 400, responseBody),
            );
            validation.execute("Error envelope", () =>
                validator.validateErrorResponse(rawResponse.status(), responseBody, [
                    400,
                ]),
            );

            validation.printSummary("Save Profile Image — Empty Body", responseTime);
        },
    );
});
