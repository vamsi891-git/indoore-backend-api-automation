export interface RawConsumptionPatternRow {
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
  kWh?: number | string;
}

export interface ConsumptionPatternRow {
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
  kWh: number;
}

export interface ConsumptionPatternGridColumn {
  key: string;
  header: string;
}

export interface ConsumptionPatternData {
  columns?: ConsumptionPatternGridColumn[];
  rows: RawConsumptionPatternRow[];
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

export interface ConsumptionPatternResponse {
  success: boolean;
  data?: ConsumptionPatternData;
  error?: { code?: string; message?: string };
}

function trimField(value: string | undefined): string {
  return String(value ?? "").trim();
}

export function mapConsumptionPatternResponse(
  response: ConsumptionPatternResponse,
): ConsumptionPatternRow[] {
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
    kWh: Number(row.kWh),
  }));
}
