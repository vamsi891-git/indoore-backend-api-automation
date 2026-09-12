export type DtrConsumptionDetailsKind = "kwh" | "kvah" | "kvarh";

export type DtrConsumptionDetailsScenario =
    | "dev_live_kwh"
    | "dev_live_kvah"
    | "dev_live_kvarh"
    | "dev_live_page_limit"
    | "dev_ignore_unknown_query"
    | "contract_kwh_empty"
    | "contract_kvah_empty"
    | "contract_kvarh_empty"
    | "contract_kwh_with_rows"
    | "contract_kvah_with_rows"
    | "contract_kvarh_with_rows";

export interface DtrConsumptionDetailsColumn {
    key: string;
    header: string;
}

export interface DtrConsumptionDetailsPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export type DtrConsumptionDetailsRow = Record<string, unknown>;

export interface DtrConsumptionDetailsDataModel {
    columns: DtrConsumptionDetailsColumn[];
    rows: DtrConsumptionDetailsRow[];
    pagination: DtrConsumptionDetailsPagination;
}

export interface DtrConsumptionDetailsResponse {
    success: boolean;
    data?: DtrConsumptionDetailsDataModel | null;
    message?: string;
}

export interface DtrConsumptionDetailsErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

export interface MappedDtrConsumptionDetails {
    success: boolean;
    message?: string;
    columns: DtrConsumptionDetailsColumn[];
    rows: DtrConsumptionDetailsRow[];
    pagination: DtrConsumptionDetailsPagination;
}

function toNumber(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export class DtrConsumptionDetailsMapper {
    static map(
        response: DtrConsumptionDetailsResponse,
    ): MappedDtrConsumptionDetails {
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
