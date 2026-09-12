export type ConsumerPhase = "1 PH" | "3 PH WC" | "3 PH 4 CT" | "HT";

export type ConsumerPhaseDistributionScenario =
  | "dev_live_1ph"
  | "dev_live_3ph_wc"
  | "dev_live_3ph_4ct"
  | "dev_live_ht"
  | "dev_live_page_limit"
  | "dev_ignore_unknown_query"
  | "contract_1ph"
  | "contract_3ph_wc"
  | "contract_1ph_empty";

export interface ConsumerPhaseDistributionColumn {
  key: string;
  header: string;
}

export interface ConsumerPhaseDistributionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ConsumerPhaseDistributionRow = Record<string, unknown>;

export interface ConsumerPhaseDistributionDataModel {
  columns: ConsumerPhaseDistributionColumn[];
  rows: ConsumerPhaseDistributionRow[];
  pagination: ConsumerPhaseDistributionPagination;
}

export interface ConsumerPhaseDistributionResponse {
  success: boolean;
  data?: ConsumerPhaseDistributionDataModel | null;
  message?: string;
}

export interface ConsumerPhaseDistributionErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface MappedConsumerPhaseDistribution {
  success: boolean;
  message?: string;
  columns: ConsumerPhaseDistributionColumn[];
  rows: ConsumerPhaseDistributionRow[];
  pagination: ConsumerPhaseDistributionPagination;
}

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export class ConsumerPhaseDistributionMapper {
  static map(
    response: ConsumerPhaseDistributionResponse,
  ): MappedConsumerPhaseDistribution {
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
