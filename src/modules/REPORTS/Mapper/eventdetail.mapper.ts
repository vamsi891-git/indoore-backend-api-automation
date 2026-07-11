export const eventDetailColumnKeys = [
    "slNo",
    "division",
    "zone",
    "feeder",
    "dtr",
    "name",
    "address",
    "ivrsNumber",
    "tariff",
    "msn",
    "phase",
    "eventClassificationName",
    "eventId",
    "eventName",
    "eventCount",
    "durationHhMm",
] as const;

export type EventDetailColumnKey = (typeof eventDetailColumnKeys)[number];

export interface EventDetailColumn {
    key: string;
    header: string;
}

export interface EventDetailRow {
    id: string;
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

export interface EventDetailPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface EventDetailDataModel {
    columns: EventDetailColumn[];
    rows: EventDetailRow[];
    pagination: EventDetailPagination;
}

export interface EventDetailErrorBody {
    success: boolean;
    error?: {
        code: string;
        message: string;
    };
}

export interface EventDetailResponse {
    success: boolean;
    data?: EventDetailDataModel | null;
    message?: string;
    error?: EventDetailErrorBody["error"];
}

export interface MappedEventDetail {
    success: boolean;
    columns: EventDetailColumn[];
    rows: EventDetailRow[];
    pagination: EventDetailPagination;
}

export type EventDetailScenario =
    | "dev_live_primary"
    | "dev_live_page_beyond"
    | "dev_ignore_unknown_query"
    | "contract_live_full"
    | "contract_empty_page"
    | "invalid_date_range"
    | "invalid_date_format"
    | "missing_from_date";

const EMPTY_PAGINATION: EventDetailPagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
};

export class EventDetailMapper {
    static map(response: EventDetailResponse): MappedEventDetail {
        const data = response.data ?? ({} as EventDetailDataModel);
        const pagination = data.pagination ?? EMPTY_PAGINATION;

        return {
            success: response.success,
            columns: data.columns ?? [],
            rows: data.rows ?? [],
            pagination: {
                page: Number(pagination.page ?? 1),
                limit: Number(pagination.limit ?? 10),
                total: Number(pagination.total ?? 0),
                totalPages: Number(pagination.totalPages ?? 0),
            },
        };
    }
}
