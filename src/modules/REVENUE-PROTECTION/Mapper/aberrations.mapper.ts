export interface AberrationsQuery {
  organisationLookupId: number;
  month: string;
  year: number | string;
  servicePointMeterPhaseTblRefId?: number;
  categoryTblRefId?: number;
  eventTblRefId?: number;
  page?: number;
  limit?: number;
}

export interface GridColumn {
  key: string;
  header: string;
}

export interface AberrationSummaryRowRaw {
  id?: string | number;
  circle?: string | null;
  month?: string | null;
  year?: string | number | null;
  noOfCases?: number | string | null;
  totalCasesAttended?: number | string | null;
  pending?: number | string | null;
  amountBilled?: number | string | null;
  amountRealisation?: number | string | null;
}

export interface AberrationPaginationRaw {
  page?: number | string | null;
  limit?: number | string | null;
  total?: number | string | null;
  totalPages?: number | string | null;
}

export interface AberrationsRawData {
  columns?: GridColumn[];
  rows?: AberrationSummaryRowRaw[];
  pagination?: AberrationPaginationRaw;
}

export interface AberrationsResponse {
  success: boolean;
  data?: AberrationsRawData;
  error?: { code?: string; message?: string };
}

export interface AberrationSummaryRow {
  id: string;
  circle: string;
  month: string;
  year: string;
  noOfCases: number;
  totalCasesAttended: number;
  pending: number;
  amountBilled: number;
  amountRealisation: number;
}

export interface AberrationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AberrationsData {
  columns: GridColumn[];
  rows: AberrationSummaryRow[];
  pagination: AberrationPagination;
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value).trim();
}

export class AberrationsMapper {
  static mapRow(row: AberrationSummaryRowRaw): AberrationSummaryRow {
    return {
      id: toText(row.id),
      circle: toText(row.circle),
      month: toText(row.month),
      year: toText(row.year),
      noOfCases: toNumber(row.noOfCases),
      totalCasesAttended: toNumber(row.totalCasesAttended),
      pending: toNumber(row.pending),
      amountBilled: toNumber(row.amountBilled),
      amountRealisation: toNumber(row.amountRealisation),
    };
  }

  static mapData(data: AberrationsRawData | undefined): AberrationsData {
    const pagination = data?.pagination ?? {};
    return {
      columns: Array.isArray(data?.columns) ? data!.columns : [],
      rows: Array.isArray(data?.rows)
        ? data!.rows.map((row) => AberrationsMapper.mapRow(row))
        : [],
      pagination: {
        page: toNumber(pagination.page, 1),
        limit: toNumber(pagination.limit, 10),
        total: toNumber(pagination.total, 0),
        totalPages: toNumber(pagination.totalPages, 0),
      },
    };
  }
}
