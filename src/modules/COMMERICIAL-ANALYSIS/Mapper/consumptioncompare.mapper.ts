export interface RawConsumptionCompareRow {
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
  prevKwh: number;
  currKwh: number;
}

export interface ConsumptionCompareRow {
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
  prevKwh: number;
  currKwh: number;
}

export interface ConsumptionCompareData {
  reportName: string;
  description: string;
  month: number;
  year: number;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  rows: RawConsumptionCompareRow[];
}

export interface ConsumptionCompareResponse {
  success: boolean;
  data: ConsumptionCompareData;
}

export function mapConsumptionCompareResponse(
  response: ConsumptionCompareResponse,
): ConsumptionCompareRow[] {
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
    prevKwh: Number(row.prevKwh),
    currKwh: Number(row.currKwh),
  }));
}
