export interface RawLFAnalysisRow {
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
  lf?: number | string;
  LF?: number | string;
  displayLf?: number | string;
  "LF<5%"?: number | string;
  "LF>100%"?: number | string;
}

export interface LFAnalysisRow {
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
  lf: number;
  /** Live LF<5% column is the threshold echo (5). */
  reportThreshold?: number;
  /** Live LF>100% column is sanctioned load kW, not the 100% cutoff. */
  sanctionedLoadKw?: number;
}

export interface LFAnalysisGridColumn {
  key: string;
  header: string;
}

/** Live GET /analysis/commercial/lf returns a grid, not reportName/month echo. */
export interface LFAnalysisData {
  columns?: LFAnalysisGridColumn[];
  rows: RawLFAnalysisRow[];
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

export interface LFAnalysisResponse {
  success: boolean;
  data: LFAnalysisData;
}

function trimField(value: string | undefined): string {
  return String(value ?? "").trim();
}

export function mapLFAnalysisResponse(
  response: LFAnalysisResponse,
): LFAnalysisRow[] {
  const rows = response?.data?.rows;
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const reportThreshold =
      row["LF<5%"] !== undefined ? Number(row["LF<5%"]) : undefined;
    const sanctionedLoadKw =
      row["LF>100%"] !== undefined ? Number(row["LF>100%"]) : undefined;
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
      lf: Number(row.LF ?? row.displayLf ?? row.lf),
      reportThreshold: Number.isFinite(reportThreshold)
        ? reportThreshold
        : undefined,
      sanctionedLoadKw: Number.isFinite(sanctionedLoadKw)
        ? sanctionedLoadKw
        : undefined,
    };
  });
}
