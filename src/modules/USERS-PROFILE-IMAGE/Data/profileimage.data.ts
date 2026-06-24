import { PROFILE_IMAGE_TEST_BYTES } from "../utils/profileimage-upload.util";

export const ProfileImageData = {
    maxResponseTime: 60000,
    contentType: "image/png",
    fileName: "automation-profile.png",
    fileSize: PROFILE_IMAGE_TEST_BYTES.length,
    buildUploadRequest(): {
        contentType: string;
        fileName: string;
        fileSize: number;
    } {
        return {
            contentType: ProfileImageData.contentType,
            fileName: ProfileImageData.fileName,
            fileSize: ProfileImageData.fileSize,
        };
    },
    uploadMissingFileNamePayload: {
        contentType: "image/png",
        fileSize: PROFILE_IMAGE_TEST_BYTES.length,
    },
    uploadMissingFileSizePayload: {
        contentType: "image/png",
        fileName: "automation-profile.png",
    },
    invalidSavePayload: {
        profileImageUrl: "not-a-valid-url",
        profileImageKey: "profile-images/users/invalid/key.png",
    },
    emptySavePayload: {},
    updatedMessage: "Profile image updated successfully",
    removedMessage: "Profile image removed successfully",
};
