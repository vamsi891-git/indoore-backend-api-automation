export type DtrPercentageLoadingDetailsBand =
    | "critical"
    | "high-load"
    | "normal"
    | "under-utilized";

export type DtrPercentageLoadingDetailsScenario =
    | "dev_live_critical"
    | "dev_live_high_load"
    | "dev_live_normal"
    | "dev_live_under_utilized"
    | "dev_live_page_limit"
    | "dev_ignore_unknown_query"
    | "contract_critical_empty"
    | "contract_high_load_empty"
    | "contract_normal_empty"
    | "contract_under_utilized_empty"
    | "contract_critical_with_rows"
    | "contract_high_load_with_rows"
    | "contract_normal_with_rows"
    | "contract_under_utilized_with_rows";

export interface DtrPercentageLoadingDetailsColumn {
    key: string;
    header: string;
}

export interface DtrPercentageLoadingDetailsPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export type DtrPercentageLoadingDetailsRow = Record<string, unknown>;

export interface DtrPercentageLoadingDetailsDataModel {
    columns: DtrPercentageLoadingDetailsColumn[];
    rows: DtrPercentageLoadingDetailsRow[];
    pagination: DtrPercentageLoadingDetailsPagination;
}

export interface DtrPercentageLoadingDetailsResponse {
    success: boolean;
    data?: DtrPercentageLoadingDetailsDataModel | null;
    message?: string;
}

export interface DtrPercentageLoadingDetailsErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

export interface MappedDtrPercentageLoadingDetails {
    success: boolean;
    message?: string;
    columns: DtrPercentageLoadingDetailsColumn[];
    rows: DtrPercentageLoadingDetailsRow[];
    pagination: DtrPercentageLoadingDetailsPagination;
}

function toNumber(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export class DtrPercentageLoadingDetailsMapper {
    static map(
        response: DtrPercentageLoadingDetailsResponse,
    ): MappedDtrPercentageLoadingDetails {
        const data = response.data;
        const pagination = data?.pagination;

        return {
            success: Boolean(response.success),
            message: response.message,
            columns: Array.isArray(data?.columns)
                ? data!.columns.map((c) => ({
                      key: String(c?.key ?? "").trim(),
                      header: String(c?.header ?? "").trim(),
                  }))
                : [],
            rows: Array.isArray(data?.rows) ? [...data!.rows] : [],
            pagination: {
                page: toNumber(pagination?.page, 1),
                limit: toNumber(pagination?.limit, 10),
                total: toNumber(pagination?.total, 0),
                totalPages: toNumber(pagination?.totalPages, 0),
            },
        };
    }
}
