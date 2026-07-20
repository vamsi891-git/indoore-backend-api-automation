export type AberrationEntryType = "zone" | "eenltmt";

export interface AberrationEntryQuery {
  entryType?: AberrationEntryType;
  month?: string;
  year?: number | string;
  page?: number;
  limit?: number;
}

export interface AberrationEntryColumn {
  key: string;
  header: string;
}

export interface AberrationEntryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AberrationEntryRow {
  id: string;

  circle: string;
  division: string;
  zone: string;
  subStation: string;
  feeder: string;
  dtr: string;

  name: string;
  address: string;

  ivrsNo: string;
  meterSerialNo: string;

  eventName: string;

  occurrenceTime: string;
  restorationTime: string;

  remarks: string;

  amountBilled: number;
  amountRealised: number;

  fieldOfficerRemarks: string;
  fieldOfficerName: string;
  fieldOfficerDesignation: string;

  mrTransactionNo: string;

  p4No: string;
  p4Date: string;

  inspectionDate: string;

  entryDate: string;

  month: string;
  year: string;
}

export interface AberrationEntryData {
  columns: AberrationEntryColumn[];
  rows: AberrationEntryRow[];
  pagination: AberrationEntryPagination;
}

export interface AberrationEntryResponse {
  success: boolean;
  data?: AberrationEntryRawData;
  error?: { code?: string; message?: string };
  message?: string;
}

export type AberrationEntryRawRow = Record<string, unknown>;

export interface AberrationEntryPaginationRaw {
  page?: number | string | null;
  limit?: number | string | null;
  total?: number | string | null;
  totalPages?: number | string | null;
}

export interface AberrationEntryRawData {
  columns?: AberrationEntryColumn[];
  rows?: AberrationEntryRawRow[];
  pagination?: AberrationEntryPaginationRaw;
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value).trim();
}

export class AberrationEntryMapper {
  static mapData(raw: AberrationEntryRawData | undefined): AberrationEntryData {
    const pagination = raw?.pagination ?? {};
    return {
      columns: Array.isArray(raw?.columns) ? raw.columns : [],

      pagination: {
        page: toNumber(pagination.page, 1),
        limit: toNumber(pagination.limit, 10),
        total: toNumber(pagination.total, 0),
        totalPages: toNumber(pagination.totalPages, 0),
      },

      rows: (raw?.rows ?? []).map((row) => ({
        id: toText(row.id),

        circle: toText(row.circle),
        division: toText(row.division),
        zone: toText(row.zone),
        subStation: toText(row.subStation),
        feeder: toText(row.feeder),
        dtr: toText(row.dtr),

        name: toText(row.name),
        address: toText(row.address),

        ivrsNo: toText(row.ivrsNo),
        meterSerialNo: toText(row.meterSerialNo),

        eventName: toText(row.eventName),

        occurrenceTime: toText(row.occurrenceTime),
        restorationTime: toText(row.restorationTime),

        remarks: toText(row.remarks),

        amountBilled: toNumber(row.amountBilled),
        amountRealised: toNumber(row.amountRealised),

        fieldOfficerRemarks: toText(row.fieldOfficerRemarks),
        fieldOfficerName: toText(row.fieldOfficerName),
        fieldOfficerDesignation: toText(row.fieldOfficerDesignation),

        mrTransactionNo: toText(row.mrTransactionNo),

        p4No: toText(row.p4No),
        p4Date: toText(row.p4Date),

        inspectionDate: toText(row.inspectionDate),

        entryDate: toText(row.entryDate),

        month: toText(row.month),
        year: toText(row.year),
      })),
    };
  }
}