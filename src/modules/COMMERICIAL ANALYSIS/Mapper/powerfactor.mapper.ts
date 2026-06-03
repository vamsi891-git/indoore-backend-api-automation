export interface RawPowerFactorRow {
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
  PF: number;
  "PF<.8"?: number;
  pf?: number;
}

export interface PowerFactorRow {
  meterLookupId: number;
  msn: string;
  pf: number;
  reportThreshold?: number;
}

export interface PowerFactorData {
  reportName: string;
  description: string;
  month: number;
  year: number;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  rows: RawPowerFactorRow[];
}

export interface PowerFactorResponse {
  success: boolean;
  data: PowerFactorData;
}

const PF_THRESHOLD_COLUMN = "PF<.8";

export class PowerFactorMapper {
  static mapPfRows(rows: RawPowerFactorRow[]): PowerFactorRow[] {
    return rows.map((row) => ({
      meterLookupId: Number(row.meterLookupId),
      msn: row.msn?.trim(),
      pf: Number(row.PF ?? row.pf),
      reportThreshold:
        row[PF_THRESHOLD_COLUMN] !== undefined
          ? Number(row[PF_THRESHOLD_COLUMN])
          : undefined,
    }));
  }
}
