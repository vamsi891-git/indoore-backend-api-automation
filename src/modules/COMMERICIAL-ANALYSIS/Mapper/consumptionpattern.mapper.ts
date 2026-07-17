export interface RawConsumptionPatternRow {
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
  kWh: number;
}
export interface ConsumptionPatternRow {
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
  kWh: number;
}
export interface ConsumptionPatternData {
  reportName: string;
  description: string;
  month: number;
  year: number;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  rows: RawConsumptionPatternRow[];
}
export interface ConsumptionPatternResponse {
  success: boolean;
  data: ConsumptionPatternData;
}
export function mapConsumptionPatternResponse(
  response: ConsumptionPatternResponse,
): ConsumptionPatternRow[] {
  const rows = response?.data?.rows;
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => ({
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
    kWh: Number(row.kWh),
  }));
}
