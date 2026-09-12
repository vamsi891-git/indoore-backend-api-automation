export type DtrPowerStatusDetailsStatus = "on" | "off";

export type DtrPowerStatusDetailsScenario =
    | "dev_live_on"
    | "dev_live_off"
    | "dev_live_page_limit"
    | "dev_ignore_unknown_query"
    | "contract_on_empty"
    | "contract_off_empty"
    | "contract_on_with_rows"
    | "contract_off_with_rows";

export interface DtrPowerStatusDetailsColumn {
    key: string;
    header: string;
}

export interface DtrPowerStatusDetailsPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export type DtrPowerStatusDetailsRow = Record<string, unknown>;

export interface DtrPowerStatusDetailsDataModel {
    columns: DtrPowerStatusDetailsColumn[];
    rows: DtrPowerStatusDetailsRow[];
    pagination: DtrPowerStatusDetailsPagination;
}

export interface DtrPowerStatusDetailsResponse {
    success: boolean;
    data?: DtrPowerStatusDetailsDataModel | null;
    message?: string;
}

export interface DtrPowerStatusDetailsErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

export interface MappedDtrPowerStatusDetails {
    success: boolean;
    message?: string;
    columns: DtrPowerStatusDetailsColumn[];
    rows: DtrPowerStatusDetailsRow[];
    pagination: DtrPowerStatusDetailsPagination;
}

function toNumber(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export class DtrPowerStatusDetailsMapper {
    static map(
        response: DtrPowerStatusDetailsResponse,
    ): MappedDtrPowerStatusDetails {
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
