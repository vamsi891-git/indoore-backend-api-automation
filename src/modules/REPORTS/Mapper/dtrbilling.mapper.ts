export interface DtrBillingAppliedFilters {
    organisationLookupId: number | null;
    networkLookupId: number | null;
    dtrTypeTblRefId: number | null;
    dtrRatingTblRefId: number | null;
    meterNumber: string | null;
}

export interface DtrBillingRow {
    slNo: number;
    circle: string;
    division: string;
    zone: string;
    subStation: string;
    feeder: string;
    dtr: string;
    meterSerialNumber: string;
    meterTime: string;
    billingDate: string;
    kwhImp: string;
    kwhExp: string;
    kvahImp: string;
    kvahExp: string;
    kwImp: string;
    kwDateTime: string | null;
    kvaImp: string;
    kvaDateTime: string | null;
    mf: string;
}

export interface DtrBillingReportData {
    fromDate: string;
    toDate: string;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    totalIsExact: boolean;
    scopeMeterCount: number;
    scopeTruncated: boolean;
    appliedFilters: DtrBillingAppliedFilters;
    rows: DtrBillingRow[];
}

export interface DtrBillingResponse {
    success: boolean;
    data: DtrBillingReportData;
}

export class DtrBillingMapper {
    static map(response: any): DtrBillingResponse {
        const data = response.data ?? {};
        const filters = data.appliedFilters ?? {};

        return {
            success: response.success,
            data: {
                fromDate: data.fromDate,
                toDate: data.toDate,
                page: data.page,
                limit: data.limit,
                total: data.total,
                totalPages: data.totalPages,
                totalIsExact: data.totalIsExact,
                scopeMeterCount: data.scopeMeterCount,
                scopeTruncated: data.scopeTruncated,
                appliedFilters: {
                    organisationLookupId: filters.organisationLookupId ?? null,
                    networkLookupId: filters.networkLookupId ?? null,
                    dtrTypeTblRefId: filters.dtrTypeTblRefId ?? null,
                    dtrRatingTblRefId: filters.dtrRatingTblRefId ?? null,
                    meterNumber: filters.meterNumber ?? null,
                },
                rows: data.rows ?? [],
            },
        };
    }
}
