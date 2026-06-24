import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";

const PROFILE_IMAGE_BASE = "/indore/users/me/profile-image";

export class ProfileImageApi extends TimedApiClient {
    getProfileImageUploadUrl(payload: object): Promise<ApiCallResult> {
        return this.postJson(`${PROFILE_IMAGE_BASE}/upload-url`, {
            data: payload,
        });
    }

    saveProfileImage(payload: object): Promise<ApiCallResult> {
        return this.patchJson(PROFILE_IMAGE_BASE, { data: payload });
    }

    deleteProfileImage(): Promise<ApiCallResult> {
        return this.deleteJson(PROFILE_IMAGE_BASE);
    }
}
