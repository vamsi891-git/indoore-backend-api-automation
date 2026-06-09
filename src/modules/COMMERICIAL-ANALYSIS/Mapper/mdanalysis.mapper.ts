export interface RawMdAnalysisRow {
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
  sanctionedLoad: number;
  md: number;
}

export interface MdAnalysisRow {
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
  sanctionedLoad: number;
  md: number;
}

export interface MdAnalysisData {
  reportName: string;
  description: string;
  month: number;
  year: number;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  rows: RawMdAnalysisRow[];
}

export interface MdAnalysisResponse {
  success: boolean;
  data: MdAnalysisData;
}

export function mapMdAnalysisResponse(
  response: MdAnalysisResponse,
): MdAnalysisRow[] {
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
    sanctionedLoad: Number(row.sanctionedLoad),
    md: Number(row.md),
  }));
}
