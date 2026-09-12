export interface RawDayNightRow {
  id?: string;
  meterLookupId?: number;
  circle?: string;
  division?: string;
  subDivision?: string;
  feeder?: string;
  dtr?: string;
  name?: string;
  ivrsNumber?: string;
  tariff?: string;
  msn?: string;
  phase?: string;
  count?: number | string;
  dayKwh?: number | string;
  nightKwh?: number | string;
  dayConsumption?: number | string;
  nightConsumption?: number | string;
}

export interface DayNightRow {
  id?: string;
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
  count?: number;
  dayKwh?: number;
  nightKwh?: number;
}

export interface DayNightGridColumn {
  key: string;
  header: string;
}

export interface DayNightData {
  columns?: DayNightGridColumn[];
  rows: RawDayNightRow[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  available?: boolean;
  unavailableReason?: "BILLING_PERIOD_NOT_READY" | "LS_DAY_PERIOD_NOT_READY";
  reportName?: string;
  description?: string;
  month?: number;
  year?: number;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface DayNightResponse {
  success: boolean;
  data?: DayNightData;
  error?: { code?: string; message?: string };
}

function trimField(value: string | undefined): string {
  return String(value ?? "").trim();
}

export function mapDayNightResponse(response: DayNightResponse): DayNightRow[] {
  const rows = response?.data?.rows;
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const mapped: DayNightRow = {
      id: row.id,
      meterLookupId: Number(row.meterLookupId),
      circle: trimField(row.circle),
      division: trimField(row.division),
      subDivision: trimField(row.subDivision),
      feeder: trimField(row.feeder),
      dtr: trimField(row.dtr),
      name: trimField(row.name),
      ivrsNumber: trimField(row.ivrsNumber),
      tariff: trimField(row.tariff),
      msn: trimField(row.msn),
      phase: trimField(row.phase),
    };
    if (row.count != null) {
      mapped.count = Number(row.count);
    }
    const day = row.dayKwh ?? row.dayConsumption;
    if (day != null) {
      mapped.dayKwh = Number(day);
    }
    const night = row.nightKwh ?? row.nightConsumption;
    if (night != null) {
      mapped.nightKwh = Number(night);
    }
    return mapped;
  });
}
