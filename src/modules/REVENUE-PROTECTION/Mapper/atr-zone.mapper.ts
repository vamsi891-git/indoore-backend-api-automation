export interface AtrZoneQuery {
  year: number | string;
  organisationLookupId?: number;
  servicePointMeterPhaseTblRefId?: number;
  categoryTblRefId?: number;
  eventTblRefId?: number;
  page?: number;
  limit?: number;
}

export interface AtrZoneGridColumn {
  key: string;
  header: string;
}

export interface AtrZoneRowRaw {
  id?: string | number;
  circle?: string | null;
  division?: string | null;
  zone?: string | null;
  feeder?: string | null;
  dtr?: string | null;
  feeder1?: string | null;
  dtr1?: string | null;
  ivrs?: string | null;
  meterSerialNumber?: string | null;
  eventName?: string | null;
  eventCategory?: string | null;
  occurrenceTime?: string | null;
  restorationTime?: string | null;
  remarks?: string | null;
  amountBilled?: number | string | null;
  amountRealised?: number | string | null;
  fieldRemarks?: string | null;
  p4Number?: string | null;
  p4Date?: string | null;
  entryDateTime?: string | null;
  year?: string | number | null;
  month?: string | null;
}

export interface AtrZonePaginationRaw {
  page?: number | string | null;
  limit?: number | string | null;
  total?: number | string | null;
  totalPages?: number | string | null;
}

export interface AtrZoneRawData {
  columns?: AtrZoneGridColumn[];
  rows?: AtrZoneRowRaw[];
  pagination?: AtrZonePaginationRaw;
}

export interface AtrZoneResponse {
  success: boolean;
  data?: AtrZoneRawData;
  error?: { code?: string; message?: string };
  message?: string;
}

export interface AtrZoneRow {
  id: string;
  circle: string;
  division: string;
  zone: string;
  feeder: string;
  dtr: string;
  feeder1: string;
  dtr1: string;
  ivrs: string;
  meterSerialNumber: string;
  eventName: string;
  eventCategory: string;
  occurrenceTime: string;
  restorationTime: string;
  remarks: string;
  amountBilled: number;
  amountRealised: number;
  fieldRemarks: string;
  p4Number: string;
  p4Date: string;
  entryDateTime: string;
  year: string;
  month: string;
}

export interface AtrZonePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AtrZoneData {
  columns: AtrZoneGridColumn[];
  rows: AtrZoneRow[];
  pagination: AtrZonePagination;
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export class AtrZoneMapper {
  static mapRow(row: AtrZoneRowRaw): AtrZoneRow {
    return {
      id: toText(row.id).trim(),
      circle: toText(row.circle),
      division: toText(row.division),
      zone: toText(row.zone),
      feeder: toText(row.feeder),
      dtr: toText(row.dtr),
      feeder1: toText(row.feeder1),
      dtr1: toText(row.dtr1),
      ivrs: toText(row.ivrs),
      meterSerialNumber: toText(row.meterSerialNumber),
      eventName: toText(row.eventName),
      eventCategory: toText(row.eventCategory),
      occurrenceTime: toText(row.occurrenceTime).trim(),
      restorationTime: toText(row.restorationTime).trim(),
      remarks: toText(row.remarks),
      amountBilled: toNumber(row.amountBilled),
      amountRealised: toNumber(row.amountRealised),
      fieldRemarks: toText(row.fieldRemarks),
      p4Number: toText(row.p4Number),
      p4Date: toText(row.p4Date).trim(),
      entryDateTime: toText(row.entryDateTime).trim(),
      year: toText(row.year).trim(),
      month: toText(row.month).trim(),
    };
  }

  static mapData(data: AtrZoneRawData | undefined): AtrZoneData {
    const pagination = data?.pagination ?? {};
    return {
      columns: Array.isArray(data?.columns) ? data!.columns : [],
      rows: Array.isArray(data?.rows)
        ? data!.rows.map((row) => AtrZoneMapper.mapRow(row))
        : [],
      pagination: {
        page: toNumber(pagination.page, 1),
        limit: toNumber(pagination.limit, 10),
        total: toNumber(pagination.total, 0),
        totalPages: toNumber(pagination.totalPages, 0),
      },
    };
  }
}