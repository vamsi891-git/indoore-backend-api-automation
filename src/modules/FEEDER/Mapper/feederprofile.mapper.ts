export interface ParentDtr {
    dtrCode: string;
    dtrName: string;
}

export interface OverviewItem {
    title: string;
    value: string | null;
}

export interface FeederProfileData {
    feederCode: string;
    feederName: string | null;
    status: string;
    parentDtr: ParentDtr | null;
    overview: OverviewItem[];
}

export interface FeederProfileResponse {
    success: boolean;
    data: FeederProfileData;
}

export class FeederProfileMapper {
    static map(response: FeederProfileResponse): FeederProfileData {
        return {
            feederCode: response.data?.feederCode ?? "",
            feederName: response.data?.feederName ?? null,
            status: response.data?.status ?? "",
            parentDtr: response.data?.parentDtr ?? null,
            overview: response.data?.overview ?? []
        };
    }
}
