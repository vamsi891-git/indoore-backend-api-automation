export interface TechnicalReportRow {
  id?: string;
  meterLookupId: number;
  subDivision: string;
  subStation: string;
  feeder: string;
  dtr: string;
  name: string;
  address: string;
  ivrsNumber: string;
  category: string;
  msn: string;
  phase: string;
  durationInHours?: number;
  eventName: string;
}

export interface TechnicalGridPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Live technical reports return `{ columns, rows, pagination }` without query echo. */
export interface TechnicalGridData {
  columns?: Array<{ key: string; header: string }>;
  rows: TechnicalReportRow[];
  pagination: TechnicalGridPagination;
}

export interface TechnicalReportLegacyData {
  analysisType?: string;
  reportName?: string;
  condition?: string;
  category?: string;
  month?: number;
  year?: number;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  rows?: TechnicalReportRow[];
}

export type TechnicalReportRawData = TechnicalGridData | TechnicalReportLegacyData;

export interface TechnicalReportResponse {
  success: boolean;
  data: TechnicalReportRawData;
}

export interface TechnicalReportQuery {
  analysisType: string;
  month: number;
  year: number;
  pageSize: number;
  category?: string;
  page?: number;
}

export interface TechnicalReportMapped {
  analysisType: string;
  reportName?: string;
  condition?: string;
  category: string;
  month: number;
  year: number;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  rows: TechnicalReportRow[];
}

export function isTechnicalGridData(
  data: unknown,
): data is TechnicalGridData {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const record = data as Record<string, unknown>;
  return (
    Array.isArray(record.rows) &&
    typeof record.pagination === "object" &&
    record.pagination !== null
  );
}

export class TechnicalReportMapper {
  static map(
    response: TechnicalReportResponse,
    query: TechnicalReportQuery,
  ): TechnicalReportMapped {
    const data = response.data;
    const category = query.category ?? "total";

    if (isTechnicalGridData(data)) {
      const { pagination, rows } = data;
      return {
        analysisType: query.analysisType,
        category,
        month: query.month,
        year: query.year,
        page: pagination.page,
        pageSize: pagination.limit,
        totalCount: pagination.total,
        totalPages: pagination.totalPages,
        rows,
      };
    }

    const flat = data as TechnicalReportLegacyData;
    return {
      analysisType: flat.analysisType ?? query.analysisType,
      reportName: flat.reportName,
      condition: flat.condition,
      category: flat.category ?? category,
      month: flat.month ?? query.month,
      year: flat.year ?? query.year,
      page: flat.page ?? query.page ?? 1,
      pageSize: flat.pageSize ?? query.pageSize,
      totalCount: flat.totalCount ?? 0,
      totalPages: flat.totalPages ?? 0,
      rows: flat.rows ?? [],
    };
  }
}
