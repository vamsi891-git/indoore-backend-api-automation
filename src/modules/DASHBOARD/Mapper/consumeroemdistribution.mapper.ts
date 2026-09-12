/** Consumer OEM drill-down — GET /indore/dashboard/consumer/oem-distribution */

export type ConsumerOemDistributionScenario =
  | "dev_live_lt"
  | "dev_live_linkwell"
  | "dev_live_page_limit"
  | "dev_ignore_unknown_query"
  | "contract_lt"
  | "contract_linkwell"
  | "contract_lt_empty";

export interface ConsumerOemDistributionColumn {
  key: string;
  header: string;
}

export interface ConsumerOemDistributionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ConsumerOemDistributionRow = Record<string, unknown>;

export interface ConsumerOemDistributionDataModel {
  columns: ConsumerOemDistributionColumn[];
  rows: ConsumerOemDistributionRow[];
  pagination: ConsumerOemDistributionPagination;
}

export interface ConsumerOemDistributionResponse {
  success: boolean;
  data?: ConsumerOemDistributionDataModel | null;
  message?: string;
}

export interface ConsumerOemDistributionErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface MappedConsumerOemDistribution {
  success: boolean;
  message?: string;
  columns: ConsumerOemDistributionColumn[];
  rows: ConsumerOemDistributionRow[];
  pagination: ConsumerOemDistributionPagination;
}

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export class ConsumerOemDistributionMapper {
  static map(
    response: ConsumerOemDistributionResponse,
  ): MappedConsumerOemDistribution {
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
