export type DtrCommunicationDetailsStatus =
    | "communicated"
    | "non-communicated";

export type DtrCommunicationDetailsScenario =
    | "dev_live_communicated"
    | "dev_live_non_communicated"
    | "dev_live_page_limit"
    | "dev_ignore_unknown_query"
    | "dev_reject_legacy_status"
    | "contract_communicated_empty"
    | "contract_non_communicated_empty"
    | "contract_non_communicated_with_rows"
    | "contract_communicated_with_rows";

export interface DtrCommunicationDetailsColumn {
    key: string;
    header: string;
}

export interface DtrCommunicationDetailsPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export type DtrCommunicationDetailsRow = Record<string, unknown>;

export interface DtrCommunicationDetailsDataModel {
    columns: DtrCommunicationDetailsColumn[];
    rows: DtrCommunicationDetailsRow[];
    pagination: DtrCommunicationDetailsPagination;
}

export interface DtrCommunicationDetailsResponse {
    success: boolean;
    data?: DtrCommunicationDetailsDataModel | null;
    message?: string;
}

export interface DtrCommunicationDetailsErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

export interface MappedDtrCommunicationDetails {
    success: boolean;
    message?: string;
    columns: DtrCommunicationDetailsColumn[];
    rows: DtrCommunicationDetailsRow[];
    pagination: DtrCommunicationDetailsPagination;
}

function toNumber(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export class DtrCommunicationDetailsMapper {
    static map(
        response: DtrCommunicationDetailsResponse,
    ): MappedDtrCommunicationDetails {
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
