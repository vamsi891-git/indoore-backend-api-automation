export interface EventDetailAppliedFilters {
    organisationLookupId: number | null;
    networkLookupId: number | null;
    servicePointMeterPhaseTblRefId: number | null;
    categoryTblRefId: number | null;
    priorityTblRefId: number | null;
    eventClassificationTblRefId: number | null;
    eventTblRefId: number | null;
    meterSerialNumber: string | null;
    ivrsNumber: string | null;
}

export interface EventDetailRow {
    slNo: number;
    division: string;
    zone: string;
    feeder: string;
    dtr: string;
    name: string;
    address: string;
    ivrsNumber: string;
    tariff: string;
    msn: string;
    phase: string;
    eventClassificationName: string;
    eventId: number;
    eventName: string;
    eventCount: number;
    durationHhMm: string;
}

export interface EventDetailReportData {
    fromDate: string;
    toDate: string;
    limit: number;
    scopedMeterCount: number;
    totalRowCount: number;
    truncated: boolean;
    previewNote: string;
    appliedFilters: EventDetailAppliedFilters;
    rows: EventDetailRow[];
}

export interface EventDetailResponse {
    success: boolean;
    data: EventDetailReportData;
}

export class EventDetailMapper {
    static map(response: any): EventDetailResponse {
        const data = response.data ?? {};
        const filters = data.appliedFilters ?? {};

        return {
            success: response.success,
            data: {
                fromDate: data.fromDate,
                toDate: data.toDate,
                limit: data.limit,
                scopedMeterCount: data.scopedMeterCount,
                totalRowCount: data.totalRowCount,
                truncated: data.truncated,
                previewNote: data.previewNote ?? "",
                appliedFilters: {
                    organisationLookupId: filters.organisationLookupId ?? null,
                    networkLookupId: filters.networkLookupId ?? null,
                    servicePointMeterPhaseTblRefId:
                        filters.servicePointMeterPhaseTblRefId ?? null,
                    categoryTblRefId: filters.categoryTblRefId ?? null,
                    priorityTblRefId: filters.priorityTblRefId ?? null,
                    eventClassificationTblRefId:
                        filters.eventClassificationTblRefId ?? null,
                    eventTblRefId: filters.eventTblRefId ?? null,
                    meterSerialNumber: filters.meterSerialNumber ?? null,
                    ivrsNumber: filters.ivrsNumber ?? null,
                },
                rows: data.rows ?? [],
            },
        };
    }
}
