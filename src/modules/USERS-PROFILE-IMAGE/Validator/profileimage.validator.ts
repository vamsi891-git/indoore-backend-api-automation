import { expect } from "@playwright/test";
import {
    ProfileImageUploadData,
    ProfileImageUser,
} from "../Mapper/profileimage.mapper";

export class ProfileImageValidator {
    validateResponse(response: { success?: boolean; data?: unknown }): void {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }

    validateUploadUrlData(data: ProfileImageUploadData): void {
        expect(data.uploadUrl).toMatch(/^https:\/\//);
        expect(data.uploadUrl).toContain("X-Amz-Signature");
        expect(data.fileUrl).toMatch(/^https:\/\//);
        expect(data.fileUrl).toContain("profile-images/users/");
        expect(data.key).toMatch(/^profile-images\/users\//);
        expect(data.fileUrl).toContain(data.key.split("/").pop() ?? "");
    }

    validateProfileImageSaved(
        user: ProfileImageUser,
        fileUrl: string,
        key: string,
    ): void {
        expect(user.profileImageUrl).toBe(fileUrl);
        expect(user.profileImageKey).toBe(key);
        expect(user.profileImageViewUrl).toBeTruthy();
        expect(user.profileImageViewUrl).toMatch(/^https:\/\//);
        expect(user.profileImageViewUrl).toContain(key.split("/").pop() ?? "");
    }

    validateProfileImageRemoved(user: ProfileImageUser): void {
        expect(user.profileImageUrl).toBeNull();
        expect(user.profileImageKey).toBeNull();
        expect(user.profileImageViewUrl).toBeNull();
    }

    validateSuccessMessage(message: string, expected: string): void {
        expect(message).toBe(expected);
    }

    validateUserIdentity(user: ProfileImageUser): void {
        expect(user.id).toBeTruthy();
        expect(user.email).toContain("@");
        expect(user.firstName).toBeTruthy();
        expect(user.lastName).toBeTruthy();
        expect(user.role).toBeTruthy();
        expect(user.status).toBeTruthy();
    }

    validateErrorResponse(
        status: number,
        body: { success?: boolean; error?: { code?: string; message?: string } },
        expectedStatuses: number[],
    ): void {
        expect(expectedStatuses).toContain(status);
        expect(body.success).toBe(false);
        expect(body.error?.code).toBeTruthy();
    }
}
