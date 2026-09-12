export type DtrVoltageUnbalanceSeverity =
    | "severe"
    | "moderate"
    | "balanced";

export type DtrVoltageUnbalanceDetailsScenario =
    | "dev_live_severe"
    | "dev_live_moderate"
    | "dev_live_balanced"
    | "dev_live_page_limit"
    | "dev_ignore_unknown_query"
    | "contract_severe_empty"
    | "contract_moderate_empty"
    | "contract_balanced_empty"
    | "contract_severe_with_rows"
    | "contract_balanced_with_rows";

export interface DtrVoltageUnbalanceDetailsColumn {
    key: string;
    header: string;
}

export interface DtrVoltageUnbalanceDetailsPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export type DtrVoltageUnbalanceDetailsRow = Record<string, unknown>;

export interface DtrVoltageUnbalanceDetailsDataModel {
    columns: DtrVoltageUnbalanceDetailsColumn[];
    rows: DtrVoltageUnbalanceDetailsRow[];
    pagination: DtrVoltageUnbalanceDetailsPagination;
}

export interface DtrVoltageUnbalanceDetailsResponse {
    success: boolean;
    data?: DtrVoltageUnbalanceDetailsDataModel | null;
    message?: string;
}

export interface DtrVoltageUnbalanceDetailsErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

export interface MappedDtrVoltageUnbalanceDetails {
    success: boolean;
    message?: string;
    columns: DtrVoltageUnbalanceDetailsColumn[];
    rows: DtrVoltageUnbalanceDetailsRow[];
    pagination: DtrVoltageUnbalanceDetailsPagination;
}

function toNumber(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export class DtrVoltageUnbalanceDetailsMapper {
    static map(
        response: DtrVoltageUnbalanceDetailsResponse,
    ): MappedDtrVoltageUnbalanceDetails {
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
