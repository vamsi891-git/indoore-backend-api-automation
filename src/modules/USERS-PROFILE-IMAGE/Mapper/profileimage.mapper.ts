export interface ProfileImageUploadData {
    uploadUrl: string;
    fileUrl: string;
    key: string;
}

export interface ProfileImageUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
    profileImageKey: string | null;
    profileImageViewUrl: string | null;
    role: string;
    status: string;
}

export class ProfileImageMapper {
    static mapUploadUrl(response: {
        success?: boolean;
        data?: Partial<ProfileImageUploadData>;
    }): ProfileImageUploadData {
        const data = response?.data ?? {};
        return {
            uploadUrl: String(data.uploadUrl ?? ""),
            fileUrl: String(data.fileUrl ?? ""),
            key: String(data.key ?? ""),
        };
    }

    static mapUserMutation(response: {
        success?: boolean;
        message?: string;
        data?: { user?: ProfileImageUser };
    }): { user: ProfileImageUser; message: string } {
        return {
            user: response?.data?.user as ProfileImageUser,
            message: String(response?.message ?? ""),
        };
    }
}
