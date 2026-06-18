export type LossReportType = "billing" | "dp" | "ls";
export type LossNetworkType = "dtr" | "feeder";

export interface LossAnalysisColumn {
  key: string;
  header: string;
}

export interface LossAnalysisRow {
  id: string;
  slNo: number;
  circle: string | null;
  division: string | null;
  zone: string;
  feeder: string;
  dtrName: string;
  mf: string | number | null;
  meterSerialNumber: string;
  inputUnits: number;
  consumerCount: number;
  totalSoldUnits: number;
  lossKwh: number;
  billingEfficiencyPct: number;
  lossPct: number;
}

export interface LossAnalysisPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LossAnalysisGridData {
  columns: LossAnalysisColumn[];
  rows: LossAnalysisRow[];
  pagination: LossAnalysisPagination;
}

export interface LossAnalysisResponse {
  success: boolean;
  data: LossAnalysisGridData;
}

export interface LossAnalysisQuery {
  "report-type": LossReportType;
  month: number;
  year: number;
  fromDate: string;
  toDate: string;
  networkType: LossNetworkType;
  networkLookupId: number;
  page: number;
  limit: number;
}

export interface LossAnalysisPaginatedView {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  rows: LossAnalysisRow[];
  columns: LossAnalysisColumn[];
}

export const LOSS_ANALYSIS_COLUMN_KEYS = [
  "slNo",
  "circle",
  "division",
  "zone",
  "feeder",
  "dtrName",
  "mf",
  "meterSerialNumber",
  "inputUnits",
  "consumerCount",
  "totalSoldUnits",
  "lossKwh",
  "billingEfficiencyPct",
  "lossPct",
] as const;

export function mapLossAnalysisRows(response: LossAnalysisResponse): LossAnalysisRow[] {
  return (response.data?.rows ?? []).map((row) => ({
    ...row,
    slNo: Number(row.slNo),
    inputUnits: Number(row.inputUnits),
    consumerCount: Number(row.consumerCount),
    totalSoldUnits: Number(row.totalSoldUnits),
    lossKwh: Number(row.lossKwh),
    billingEfficiencyPct: Number(row.billingEfficiencyPct),
    lossPct: Number(row.lossPct),
    circle: row.circle == null ? null : String(row.circle).trim(),
    division: row.division == null ? null : String(row.division).trim(),
    zone: String(row.zone ?? "").trim(),
    feeder: String(row.feeder ?? "").trim(),
    dtrName: String(row.dtrName ?? "").trim(),
    meterSerialNumber: String(row.meterSerialNumber ?? "").trim(),
    id: String(row.id ?? "").trim(),
    mf: row.mf,
  }));
}

export function getLossAnalysisPaginatedView(
  response: LossAnalysisResponse,
  query: Pick<LossAnalysisQuery, "page" | "limit">,
): LossAnalysisPaginatedView {
  const { pagination, rows, columns } = response.data;
  return {
    page: pagination?.page ?? query.page,
    pageSize: pagination?.limit ?? query.limit,
    totalCount: pagination?.total ?? 0,
    totalPages: pagination?.totalPages ?? 0,
    rows: mapLossAnalysisRows(response),
    columns: columns ?? [],
  };
}
