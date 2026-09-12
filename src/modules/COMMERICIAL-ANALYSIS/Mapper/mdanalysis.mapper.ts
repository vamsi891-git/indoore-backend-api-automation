export interface RawMdAnalysisRow {
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
  sanctionedLoad?: number | string;
  Sanctioned_Load_KW?: number | string;
  md?: number | string;
  MD?: number | string;
  maxMd?: number | string;
  max_md?: number | string;
  md_kw?: number | string;
  mdDate?: string;
}

export interface MdAnalysisRow {
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
  sanctionedLoad: number;
  md: number;
  mdDate: string;
}

export interface MdAnalysisGridColumn {
  key: string;
  header: string;
}

export interface MdAnalysisData {
  reportName?: string;
  description?: string;
  month?: number;
  year?: number;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  columns?: MdAnalysisGridColumn[];
  rows: RawMdAnalysisRow[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MdAnalysisResponse {
  success: boolean;
  data: MdAnalysisData;
}

function trimField(value: string | undefined): string {
  return String(value ?? "").trim();
}

function firstFiniteNumber(...values: unknown[]): number {
  for (const value of values) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return Number.NaN;
}

export function mapMdAnalysisResponse(
  response: MdAnalysisResponse,
): MdAnalysisRow[] {
  const rows = response?.data?.rows;
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const record = row as unknown as Record<string, unknown>;
    return {
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
      sanctionedLoad: firstFiniteNumber(
        row.sanctionedLoad,
        row.Sanctioned_Load_KW,
        record.sanctioned_load,
        record.sanctionLoad,
      ),
      md: pickMdValue(record),
      mdDate: trimField(row.mdDate),
    };
  });
}

function pickMdValue(row: Record<string, unknown>): number {
  const direct = firstFiniteNumber(
    row.md,
    row.MD,
    row.maxMd,
    row.max_md,
    row.md_kw,
    row.mdKw,
    row.maxMD,
  );
  if (Number.isFinite(direct)) {
    return direct;
  }
  for (const [key, value] of Object.entries(row)) {
    if (
      /sanction|load|meter|lookup|ivrs|msn|phase|name|circle|division|feeder|dtr|tariff/i.test(
        key,
      )
    ) {
      continue;
    }
    if (!/md/i.test(key) || /date/i.test(key)) {
      continue;
    }
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return Number.NaN;
}
