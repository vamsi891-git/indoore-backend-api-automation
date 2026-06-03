export interface ProfileItem {
    title: string;
    value: string | null;
}
export interface ActivityItem {
    title: string;
    timestamp: string;
}
export interface DtrProfileDataModel {
    profileInformation: ProfileItem[];
    hierarchy: ProfileItem[];
    latestActivities: ActivityItem[];
}
export interface DtrProfileResponse {
    success: boolean;
    data: DtrProfileDataModel;
}

export class DtrProfileMapper {
    static map(response: DtrProfileResponse) {
        return {
            profileInformation:response.data.profileInformation,
            hierarchy:response.data.hierarchy,
            latestActivities:response.data.latestActivities
        };
    }
}