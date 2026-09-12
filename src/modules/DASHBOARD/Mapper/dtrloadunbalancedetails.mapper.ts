export type DtrLoadUnbalanceSeverity =
    | "severe"
    | "moderate"
    | "balanced";

export type DtrLoadUnbalanceDetailsScenario =
    | "dev_live_severe"
    | "dev_live_moderate"
    | "dev_live_balanced"
    | "dev_live_page_limit"
    | "dev_ignore_unknown_query"
    | "contract_severe_empty"
    | "contract_moderate_empty"
    | "contract_balanced_empty"
    | "contract_severe_with_rows"
    | "contract_moderate_with_rows";

export interface DtrLoadUnbalanceDetailsColumn {
    key: string;
    header: string;
}

export interface DtrLoadUnbalanceDetailsPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export type DtrLoadUnbalanceDetailsRow = Record<string, unknown>;

export interface DtrLoadUnbalanceDetailsDataModel {
    columns: DtrLoadUnbalanceDetailsColumn[];
    rows: DtrLoadUnbalanceDetailsRow[];
    pagination: DtrLoadUnbalanceDetailsPagination;
}

export interface DtrLoadUnbalanceDetailsResponse {
    success: boolean;
    data?: DtrLoadUnbalanceDetailsDataModel | null;
    message?: string;
}

export interface DtrLoadUnbalanceDetailsErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

export interface MappedDtrLoadUnbalanceDetails {
    success: boolean;
    message?: string;
    columns: DtrLoadUnbalanceDetailsColumn[];
    rows: DtrLoadUnbalanceDetailsRow[];
    pagination: DtrLoadUnbalanceDetailsPagination;
}

function toNumber(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export class DtrLoadUnbalanceDetailsMapper {
    static map(
        response: DtrLoadUnbalanceDetailsResponse,
    ): MappedDtrLoadUnbalanceDetails {
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
