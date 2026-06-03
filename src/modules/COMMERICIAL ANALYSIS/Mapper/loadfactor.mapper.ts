export interface RawLFAnalysisRow {
  meterLookupId: number;
  circle: string;
  division: string;
  subDivision: string;
  feeder: string;
  dtr: string;
  name: string;
  ivrsNumber: string;
  tariff: string;
  msn: string;
  phase: string;
  lf: number;
}

export interface LFAnalysisRow {
  meterLookupId: number;
  circle: string;
  division: string;
  subDivision: string;
  feeder: string;
  dtr: string;
  name: string;
  ivrsNumber: string;
  tariff: string;
  msn: string;
  phase: string;
  lf: number;
}

export interface LFAnalysisData {
  reportName: string;
  description: string;
  month: number;
  year: number;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  rows: RawLFAnalysisRow[];
}

export interface LFAnalysisResponse {
  success: boolean;
  data: LFAnalysisData;
}

export function mapLFAnalysisResponse(
  response: LFAnalysisResponse,
): LFAnalysisRow[] {
  return response.data.rows.map((row) => ({
    meterLookupId: Number(row.meterLookupId),
    circle: row.circle?.trim(),
    division: row.division?.trim(),
    subDivision: row.subDivision?.trim(),
    feeder: row.feeder?.trim(),
    dtr: row.dtr?.trim(),
    name: row.name?.trim(),
    ivrsNumber: row.ivrsNumber?.trim(),
    tariff: row.tariff?.trim(),
    msn: row.msn?.trim(),
    phase: row.phase?.trim(),
    lf: Number(row.lf),
  }));
}
