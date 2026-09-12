export type ConsumerConnectionStatus =
  | "connected"
  | "disconnected"
  | "permanently-disconnected";

export type ConsumerConnectionStatusScenario =
  | "dev_live_connected"
  | "dev_live_disconnected"
  | "dev_live_permanently_disconnected"
  | "dev_live_page_limit"
  | "dev_ignore_unknown_query"
  | "contract_connected"
  | "contract_disconnected"
  | "contract_permanently_disconnected"
  | "contract_connected_empty";

export interface ConsumerConnectionStatusColumn {
  key: string;
  header: string;
}

export interface ConsumerConnectionStatusPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ConsumerConnectionStatusRow = Record<string, unknown>;

export interface ConsumerConnectionStatusDataModel {
  columns: ConsumerConnectionStatusColumn[];
  rows: ConsumerConnectionStatusRow[];
  pagination: ConsumerConnectionStatusPagination;
}

export interface ConsumerConnectionStatusResponse {
  success: boolean;
  data?: ConsumerConnectionStatusDataModel | null;
  message?: string;
}

export interface ConsumerConnectionStatusErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface MappedConsumerConnectionStatus {
  success: boolean;
  message?: string;
  columns: ConsumerConnectionStatusColumn[];
  rows: ConsumerConnectionStatusRow[];
  pagination: ConsumerConnectionStatusPagination;
}

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export class ConsumerConnectionStatusMapper {
  static map(
    response: ConsumerConnectionStatusResponse,
  ): MappedConsumerConnectionStatus {
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
        limit: toNumber(pagination?.limit, 20),
        total: toNumber(pagination?.total, 0),
        totalPages: toNumber(pagination?.totalPages, 0),
      },
    };
  }
}
