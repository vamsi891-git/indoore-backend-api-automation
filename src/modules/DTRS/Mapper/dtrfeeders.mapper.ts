export interface FeederItem {
    id: string;
    status: string;
    lastCommunication: string | null;
}
export interface DtrFeedersDataModel {
    feeders: FeederItem[];
}
export interface DtrFeedersResponse {
    success: boolean;
    data: DtrFeedersDataModel;
}
export class DtrFeedersMapper {
    static map(response: DtrFeedersResponse) {
        return {
            feeders:response.data.feeders
        };
    }
}