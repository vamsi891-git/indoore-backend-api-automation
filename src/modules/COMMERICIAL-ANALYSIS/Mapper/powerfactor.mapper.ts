export interface RawPowerFactorRow {
  id?: string;
  meterLookupId: number;
  circle?: string;
  division?: string;
  subDivision?: string;
  feeder?: string;
  dtr?: string;
  name?: string;
  ivrsNumber?: string;
  tariff?: string;
  msn: string;
  phase?: string;
  PF?: number | string;
  pf?: number | string;
  "PF<.8"?: number | string;
}

export interface PowerFactorRow {
  id?: string;
  meterLookupId: number;
  ivrsNumber: string;
  msn: string;
  dtr?: string;
  pf: number;
  reportThreshold?: number;
}

export interface PowerFactorGridColumn {
  key: string;
  header: string;
}

/** Live GET /analysis/commercial/pf returns a grid, not reportName/month echo. */
export interface PowerFactorData {
  columns?: PowerFactorGridColumn[];
  rows: RawPowerFactorRow[];
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

export interface PowerFactorResponse {
  success: boolean;
  data: PowerFactorData;
}

const PF_THRESHOLD_COLUMN = "PF<.8";

export class PowerFactorMapper {
  static mapPfRows(rows: RawPowerFactorRow[]): PowerFactorRow[] {
    return rows.map((row) => ({
      id: row.id,
      meterLookupId: Number(row.meterLookupId),
      ivrsNumber: String(row.ivrsNumber ?? "").trim(),
      msn: String(row.msn ?? "").trim(),
      dtr: String(row.dtr ?? "").trim(),
      pf: Number(row.PF ?? row.pf),
      reportThreshold:
        row[PF_THRESHOLD_COLUMN] !== undefined
          ? Number(row[PF_THRESHOLD_COLUMN])
          : undefined,
    }));
  }
}
