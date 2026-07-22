export interface CasesQuery {
  month: string;
  year: number | string;
  organisationLookupId?: number;
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
export interface CaseRowRaw {
  id?: string | number;
  circle?: string | null;
  division?: string | null;
  zone?: string | null;
  year?: string | number | null;
  month?: string | null;
  consumerName?: string | null;
  address?: string | null;
  msn?: string | null;
  category?: string | null;
  phase?: string | null;
  ivrsNo?: string | null;
  remarks?: string | null;
  event?: string | null;
  amountBilled?: number | string | null;
  amountRealisation?: number | string | null;
  p4Number?: string | null;
  p4Date?: string | null;
  entryDateTime?: string | null;
  status?: string | null;
}
export interface CasePaginationRaw {
  page?: number | string | null;
  limit?: number | string | null;
  total?: number | string | null;
  totalPages?: number | string | null;
}
export interface CasesRawData {
  columns?: GridColumn[];
  rows?: CaseRowRaw[];
  pagination?: CasePaginationRaw;
}
export interface CasesResponse {
  success: boolean;
  data?: CasesRawData;
  error?: { code?: string; message?: string };
  message?: string;
}
export interface CaseRow {
  id: string;
  circle: string;
  division: string;
  zone: string;
  year: string;
  month: string;
  consumerName: string;
  address: string;
  msn: string;
  category: string;
  phase: string;
  ivrsNo: string;
  remarks: string;
  event: string;
  amountBilled: number;
  amountRealisation: number;
  p4Number: string;
  p4Date: string;
  entryDateTime: string;
  status: string;
}
export interface CasePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface CasesData {
  columns: GridColumn[];
  rows: CaseRow[];
  pagination: CasePagination;
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
  return String(value);
}
export class CasesMapper {
  static mapRow(row: CaseRowRaw): CaseRow {
    return {
      id: toText(row.id).trim(),
      circle: toText(row.circle),
      division: toText(row.division),
      zone: toText(row.zone),
      year: toText(row.year).trim(),
      month: toText(row.month).trim(),
      consumerName: toText(row.consumerName),
      address: toText(row.address),
      msn: toText(row.msn),
      category: toText(row.category),
      phase: toText(row.phase),
      ivrsNo: toText(row.ivrsNo),
      remarks: toText(row.remarks),
      event: toText(row.event),
      amountBilled: toNumber(row.amountBilled),
      amountRealisation: toNumber(row.amountRealisation),
      p4Number: toText(row.p4Number),
      p4Date: toText(row.p4Date).trim(),
      entryDateTime: toText(row.entryDateTime).trim(),
      status: toText(row.status).trim(),
    };
  }
  static mapData(data: CasesRawData | undefined): CasesData {
    const pagination = data?.pagination ?? {};
    return {
      columns: Array.isArray(data?.columns) ? data!.columns : [],
      rows: Array.isArray(data?.rows)
        ? data!.rows.map((row) => CasesMapper.mapRow(row))
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
