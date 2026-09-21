export interface CollectionReportColumn {
  key: string;
  header: string;
}

/** Row fields vary by reportType; keep a loose but typed shape. */
export interface CollectionReportRow {
  id?: string | null;
  slNo?: number | null;
  meterLookupId?: number | null;
  organisationLookupId?: number | null;
  networkLookupId?: number | null;
  circle?: string | null;
  division?: string | null;
  zone?: string | null;
  substation?: string | null;
  feeder?: string | null;
  dtr?: string | null;
  consumerName?: string | null;
  name?: string | null;
  address?: string | null;
  ivrsNumber?: string | null;
  category?: string | null;
  meterSerialNumber?: string | null;
  phase?: string | null;
  sanctionedLoadKw?: string | number | null;
  serviceDate?: string | null;
  eventCount?: number | null;
  durationHhMm?: string | null;
  maxIR?: number | null;
  maxIN?: number | null;
  avgIR?: number | null;
  avgIN?: number | null;
  maxMdKva?: number | null;
  mdDate?: string | null;
  avgVoltage?: number | null;
  maxVoltage?: number | null;
  isZeroConsumption?: boolean | null;
  isLowConsumption?: boolean | null;
  ipCount?: number | null;
  kwh30Day?: number | null;
  meterPhaseName?: string | null;
  phaseNameRyb?: string | null;
  maxCur?: number | null;
  avgCur?: number | null;
  rvn?: number | null;
  yvn?: number | null;
  bvn?: number | null;
  irAvg?: number | null;
  iyAvg?: number | null;
  ibAvg?: number | null;
  maxV?: number | null;
  avgV?: number | null;
  eventDuration?: string | number | null;
  [key: string]: unknown;
}

export interface CollectionReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore?: boolean | null;
}

export interface CollectionReportDataModel {
  columns: CollectionReportColumn[];
  rows: CollectionReportRow[];
  pagination: CollectionReportPagination;
  metersFetched?: number | null;
  hasMore?: boolean | null;
  nextMeterLookupId?: number | null;
}

export interface CollectionReportErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface CollectionReportResponse {
  success: boolean;
  data?: CollectionReportDataModel | null;
  message?: string;
  error?: CollectionReportErrorBody["error"];
}

export interface MappedCollectionReport {
  success: boolean;
  columns: CollectionReportColumn[];
  rows: CollectionReportRow[];
  pagination: CollectionReportPagination;
  metersFetched: number | null;
  hasMore: boolean | null;
  nextMeterLookupId: number | null;
}

export type CollectionReportScenario =
  | "dev_current_mismatch"
  | "dev_neutral_zero"
  | "dev_current_imbalance"
  | "dev_no_load"
  | "dev_leakage"
  | "dev_current_analysis"
  | "dev_voltage_analysis"
  | "dev_alarm_last_gasp"
  | "dev_alarm_first_gasp"
  | "dev_alarm_last_gasp_range_rejected"
  | "dev_alarm_first_gasp_range_rejected"
  | "dev_current_mismatch_page2"
  | "dev_current_mismatch_limit_one"
  | "dev_current_mismatch_page_beyond"
  | "dev_current_mismatch_keyset"
  | "dev_ignore_unknown_query"
  | "contract_current_mismatch_sample"
  | "contract_empty_rows"
  | "invalid_date_range"
  | "invalid_date_format"
  | "invalid_to_date"
  | "missing_from_date"
  | "missing_to_date"
  | "missing_report_type"
  | "invalid_report_type"
  | "invalid_page"
  | "invalid_limit";

const EMPTY_PAGINATION: CollectionReportPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasMore: null,
};

export class CollectionReportMapper {
  static map(response: CollectionReportResponse): MappedCollectionReport {
    const data = response.data ?? ({} as CollectionReportDataModel);
    const pagination = data.pagination ?? EMPTY_PAGINATION;
    const topHasMore =
      data.hasMore === undefined
        ? pagination.hasMore === undefined
          ? null
          : Boolean(pagination.hasMore)
        : Boolean(data.hasMore);

    return {
      success: response.success,
      columns: data.columns ?? [],
      rows: data.rows ?? [],
      pagination: {
        page: Number(pagination.page ?? 1),
        limit: Number(pagination.limit ?? 10),
        total: Number(pagination.total ?? 0),
        totalPages: Number(pagination.totalPages ?? 0),
        hasMore: pagination.hasMore === undefined ? null : Boolean(pagination.hasMore),
      },
      metersFetched:
        data.metersFetched === undefined || data.metersFetched === null
          ? null
          : Number(data.metersFetched),
      hasMore: topHasMore,
      nextMeterLookupId:
        data.nextMeterLookupId === undefined || data.nextMeterLookupId === null
          ? null
          : Number(data.nextMeterLookupId),
    };
  }
}
