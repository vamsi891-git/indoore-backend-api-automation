export const dtrEventColumnKeys = [
    "slNo",
    "circle",
    "division",
    "zone",
    "subStation",
    "feeder",
    "dt",
    "dtrMeterNo",
    "dtrRatingKva",
    "eventCount",
    "durationHhMmSs",
] as const;

export type DtrEventColumnKey = (typeof dtrEventColumnKeys)[number];

export interface DtrEventColumn {
    key: string;
    header: string;
}

export interface DtrEventRow {
    id: string;
    slNo: number;
    circle: string;
    division: string;
    zone: string;
    subStation: string;
    feeder: string;
    dt: string;
    dtrMeterNo: string;
    dtrRatingKva: number | string;
    eventCount: number;
    durationHhMmSs: string;
}

export interface DtrEventPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface DtrEventDataModel {
    columns: DtrEventColumn[];
    rows: DtrEventRow[];
    pagination: DtrEventPagination;
}

export interface DtrEventErrorBody {
    success: boolean;
    error?: {
        code: string;
        message: string;
    };
}

export interface DtrEventResponse {
    success: boolean;
    data?: DtrEventDataModel | null;
    message?: string;
    error?: DtrEventErrorBody["error"];
}

export interface MappedDtrEvent {
    success: boolean;
    columns: DtrEventColumn[];
    rows: DtrEventRow[];
    pagination: DtrEventPagination;
}

export type DtrEventScenario =
    | "dev_live_primary"
    | "dev_live_page_beyond"
    | "dev_ignore_unknown_query"
    | "contract_live_empty_rows"
    | "contract_empty_page"
    | "contract_sample_row"
    | "invalid_date_range"
    | "invalid_date_format"
    | "missing_from_date";

const EMPTY_PAGINATION: DtrEventPagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
};

export class DtrEventMapper {
    static map(response: DtrEventResponse): MappedDtrEvent {
        const data = response.data ?? ({} as DtrEventDataModel);
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
