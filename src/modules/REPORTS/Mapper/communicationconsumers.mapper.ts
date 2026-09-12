export type CommunicationPeriodType = "day" | "month" | "range";

export interface CommunicationConsumersColumn {
  key: string;
  header: string;
}

export interface CommunicationConsumersRow {
  id: string;
  meterLookupId: number;
  consumerName: string;
  circle: string;
  division: string;
  zone: string;
  substation: string;
  feeder: string;
  dtrName: string;
  address: string;
  ivrsNumber: string;
  tariff: string;
  msn: string;
  phase: string;
  meterMake: string;
  mf: string;
  ipCount: number;
  dpCount: number;
  lsCount: number;
  billingCount?: number | null;
  billingMappingStatus?: string | null;
  eventCount?: number | null;
  [key: string]: string | number | null | undefined;
}

export interface CommunicationConsumersPagination {
  page: number;
  limit: number;
  total: number | null;
  totalPages: number | null;
  totalIsExact?: boolean | null;
  hasMore?: boolean | null;
}

export interface CommunicationConsumersDataModel {
  columns: CommunicationConsumersColumn[];
  rows: CommunicationConsumersRow[];
  pagination: CommunicationConsumersPagination;
}

export interface CommunicationConsumersErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface CommunicationConsumersResponse {
  success: boolean;
  data?: CommunicationConsumersDataModel | null;
  message?: string;
  error?: CommunicationConsumersErrorBody["error"];
}

export interface MappedCommunicationConsumers {
  success: boolean;
  columns: CommunicationConsumersColumn[];
  rows: CommunicationConsumersRow[];
  pagination: CommunicationConsumersPagination;
}

export type CommunicationConsumersScenario =
  | "dev_live_day"
  | "dev_live_month"
  | "dev_live_range"
  | "dev_live_page_beyond"
  | "dev_ignore_unknown_query"
  | "dev_limit_one"
  | "contract_live_day"
  | "contract_empty_page"
  | "invalid_period_type"
  | "invalid_date"
  | "missing_date"
  | "missing_month"
  | "invalid_date_range"
  | "missing_from_date"
  | "invalid_meter_type";

const EMPTY_PAGINATION: CommunicationConsumersPagination = {
  page: 1,
  limit: 50,
  total: null,
  totalPages: null,
  totalIsExact: null,
  hasMore: null,
};

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export class CommunicationConsumersMapper {
  static map(
    response: CommunicationConsumersResponse,
  ): MappedCommunicationConsumers {
    const data = response.data ?? ({} as CommunicationConsumersDataModel);
    const pagination = data.pagination ?? EMPTY_PAGINATION;

    return {
      success: response.success,
      columns: data.columns ?? [],
      rows: data.rows ?? [],
      pagination: {
        page: Number(pagination.page ?? 1),
        limit: Number(pagination.limit ?? 50),
        total: nullableNumber(pagination.total),
        totalPages: nullableNumber(pagination.totalPages),
        totalIsExact:
          pagination.totalIsExact === undefined
            ? null
            : Boolean(pagination.totalIsExact),
        hasMore:
          pagination.hasMore === undefined ? null : Boolean(pagination.hasMore),
      },
    };
  }
}
