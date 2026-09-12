export type ConsumerCategoryDistributionScenario =
  | "dev_live_residential"
  | "dev_live_commercial"
  | "dev_live_industrial"
  | "dev_live_page_limit"
  | "dev_ignore_unknown_query"
  | "contract_residential"
  | "contract_commercial"
  | "contract_residential_empty";

export interface ConsumerCategoryDistributionColumn {
  key: string;
  header: string;
}

export interface ConsumerCategoryDistributionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ConsumerCategoryDistributionRow = Record<string, unknown>;

export interface ConsumerCategoryDistributionDataModel {
  columns: ConsumerCategoryDistributionColumn[];
  rows: ConsumerCategoryDistributionRow[];
  pagination: ConsumerCategoryDistributionPagination;
}

export interface ConsumerCategoryDistributionResponse {
  success: boolean;
  data?: ConsumerCategoryDistributionDataModel | null;
  message?: string;
}

export interface ConsumerCategoryDistributionErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface MappedConsumerCategoryDistribution {
  success: boolean;
  message?: string;
  columns: ConsumerCategoryDistributionColumn[];
  rows: ConsumerCategoryDistributionRow[];
  pagination: ConsumerCategoryDistributionPagination;
}

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export class ConsumerCategoryDistributionMapper {
  static map(
    response: ConsumerCategoryDistributionResponse,
  ): MappedConsumerCategoryDistribution {
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
