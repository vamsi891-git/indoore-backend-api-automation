export interface RawConsumptionCompareRow {
  id?: string;
  meterLookupId: number;
  circle?: string;
  division?: string;
  subDivision?: string;
  subStation?: string;
  feeder?: string;
  dtr?: string;
  name?: string;
  ivrsNumber?: string;
  tariff?: string;
  msn: string;
  phase?: string;
  prevKwh?: number | string;
  currKwh?: number | string;
  avgConsumption?: number | string;
  currentConsumption?: number | string;
  old_kwh?: number | string;
  new_kwh?: number | string;
}

export interface ConsumptionCompareRow {
  id?: string;
  meterLookupId: number;
  circle: string;
  division: string;
  subDivision: string;
  subStation: string;
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

export interface ConsumptionCompareGridColumn {
  key: string;
  header: string;
}

/** Live GET /analysis/commercial/consumption-compare returns a grid. */
export interface ConsumptionCompareData {
  columns?: ConsumptionCompareGridColumn[];
  rows: RawConsumptionCompareRow[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  reportName?: string;
  description?: string;
  month?: number;
  year?: number;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface ConsumptionCompareResponse {
  success: boolean;
  data?: ConsumptionCompareData;
  error?: { code?: string; message?: string };
}

function trimField(value: string | undefined): string {
  return String(value ?? "").trim();
}

export function mapConsumptionCompareResponse(
  response: ConsumptionCompareResponse,
): ConsumptionCompareRow[] {
  const rows = response?.data?.rows;
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => ({
    id: row.id,
    meterLookupId: Number(row.meterLookupId),
    circle: trimField(row.circle),
    division: trimField(row.division),
    subDivision: trimField(row.subDivision),
    subStation: trimField(row.subStation),
    feeder: trimField(row.feeder),
    dtr: trimField(row.dtr),
    name: trimField(row.name),
    ivrsNumber: trimField(row.ivrsNumber),
    tariff: trimField(row.tariff),
    msn: trimField(row.msn),
    phase: trimField(row.phase),
    prevKwh: Number(row.prevKwh ?? row.avgConsumption ?? row.old_kwh),
    currKwh: Number(row.currKwh ?? row.currentConsumption ?? row.new_kwh),
  }));
}
