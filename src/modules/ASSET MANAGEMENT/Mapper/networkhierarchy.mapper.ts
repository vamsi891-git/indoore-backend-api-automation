export interface NetworkHierarchyResponse {
    success: boolean;
    data: NetworkHierarchyData;
}
export interface NetworkHierarchyData {
    hierarchy:
    NetworkNode[];
}
export interface NetworkNode {
    networkLookupId: number;
    networkCode: string;
    networkName: string;
    hierarchyLevel: string;
    children: NetworkNode[];
    dtrs: DtrNode[];
}
export interface DtrNode {
    networkLookupId: number;
    dtrCode: string;
    dtrName: string;
    consumerCount: number;
    dtrMeter:
    DtrMeter | null;
}
export interface DtrMeter {
    meterLookupId: number;
    meterSerialNumber: string;
    latitude: string | null;
    longitude: string | null;
}

export class NetworkHierarchyMapper {
    static mapData(data: NetworkHierarchyData): NetworkHierarchyData {
        return {
            hierarchy:data.hierarchy ?? []
        };

    }

}