export type CommunicationDtrsPeriodType = "day" | "month" | "range";

export interface CommunicationDtrsColumn {
  key: string;
  header: string;
}

export interface CommunicationDtrsRow {
  id: string;
  slNo: number;
  dtrNetworkLookupId: number;
  meterLookupId: number;
  circle: string;
  division: string;
  zone: string;
  subStation: string;
  feederName: string;
  dtrName: string;
  feederCode: string;
  dtrCode: string;
  newDtrCode: string;
  dtrCapacity: string;
  meterSerialNumber: string;
  meterMake: string;
  mf: string;
  latitude: string | null;
  longitude: string | null;
  serviceDate: string;
  ipCount: number;
  dpCount: number;
  lsCount: number;
  billingCount?: number | null;
  billingMappingStatus?: string | null;
  eventCount?: number | null;
  [key: string]: string | number | null | undefined;
}

export interface CommunicationDtrsPagination {
  page: number;
  limit: number;
  total: number | null;
  totalPages: number | null;
  totalIsExact?: boolean | null;
  hasMore?: boolean | null;
}

export interface CommunicationDtrsDataModel {
  columns: CommunicationDtrsColumn[];
  rows: CommunicationDtrsRow[];
  pagination: CommunicationDtrsPagination;
}

export interface CommunicationDtrsErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface CommunicationDtrsResponse {
  success: boolean;
  data?: CommunicationDtrsDataModel | null;
  message?: string;
  error?: CommunicationDtrsErrorBody["error"];
}

export interface MappedCommunicationDtrs {
  success: boolean;
  columns: CommunicationDtrsColumn[];
  rows: CommunicationDtrsRow[];
  pagination: CommunicationDtrsPagination;
}

export type CommunicationDtrsScenario =
  | "dev_live_month"
  | "dev_live_day"
  | "dev_live_range"
  | "dev_live_page_beyond"
  | "dev_ignore_unknown_query"
  | "dev_limit_one"
  | "contract_live_month"
  | "contract_empty_page"
  | "invalid_period_type"
  | "invalid_date"
  | "missing_date"
  | "missing_month"
  | "invalid_date_range"
  | "missing_from_date";

const EMPTY_PAGINATION: CommunicationDtrsPagination = {
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

export class CommunicationDtrsMapper {
  static map(response: CommunicationDtrsResponse): MappedCommunicationDtrs {
    const data = response.data ?? ({} as CommunicationDtrsDataModel);
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
