export interface EventReportAppliedFilters {
    organisationLookupId: number | null;
    networkLookupId: number | null;
    servicePointMeterPhaseTblRefId: number | null;
    categoryTblRefId: number | null;
    priorityTblRefId: number | null;
    eventClassificationTblRefId: number | null;
    eventTblRefId: number | null;
}

export interface EventReportItem {
    circle: string;
    eventId: number;
    eventName: string;
    meterCount: number;
    eventCount: number;
    durationHhMm: string;
    slNo: number;
}

export interface EventReportData {
    fromDate: string;
    toDate: string;
    scopedMeterCount: number;
    appliedFilters: EventReportAppliedFilters;
    items: EventReportItem[];
}

export interface EventReportResponse {
    success: boolean;
    data: EventReportData;
}

export class EventReportMapper {
    static map(response: any): EventReportResponse {
        const data = response.data ?? {};
        const filters = data.appliedFilters ?? {};

        return {
            success: response.success,
            data: {
                fromDate: data.fromDate,
                toDate: data.toDate,
                scopedMeterCount: data.scopedMeterCount,
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
                },
                items: data.items ?? [],
            },
        };
    }
}
