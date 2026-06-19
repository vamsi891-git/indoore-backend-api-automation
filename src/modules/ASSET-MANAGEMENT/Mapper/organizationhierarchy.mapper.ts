export interface OrganisationHierarchyResponse {
    success: boolean;
    data: OrganisationHierarchyData;
}

export interface OrganisationHierarchyData {
    hierarchy:
    OrganisationNode[];
}

export interface OrganisationNode {
    organisationLookupId: number;
    officeCode: string;
    officeName: string;
    hierarchyLevel: string;
    children:OrganisationNode[];
    dtrs:DtrNode[];
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

export class OrganisationHierarchyMapper {
    static mapData(data: OrganisationHierarchyData): OrganisationHierarchyData {
        return {
            hierarchy:data.hierarchy ?? []
        }
    }
}