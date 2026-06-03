export interface EventDetailRow {
  slNo: number;
  division: string;
  zone: string;
  feeder: string;
  dtr: string;
  name: string;
  address: string;
  ivrsNumber: string;
  tariff: string;
  msn: string;
  phase: string;
  eventClassificationName: string;
  eventId: number;
  eventName: string;
  eventCount: number;
  durationHhMm: string;
}
export interface EventDetailData {
  fromDate: string;
  toDate: string;
  limit: number;
  scopedMeterCount: number;
  totalRowCount: number;
  truncated: boolean;
  rows: EventDetailRow[];
}
export interface EventDetailResponse {
  success: boolean;
  data: EventDetailData;
}
export function mapEventDetailResponse(
  response: EventDetailResponse,
): EventDetailRow[] {
  return response.data.rows.map((row) => ({
    slNo: Number(row.slNo),

    division: row.division?.trim(),

    zone: row.zone?.trim(),

    feeder: row.feeder?.trim(),

    dtr: row.dtr?.trim(),

    name: row.name?.trim(),

    address: row.address?.trim(),

    ivrsNumber: row.ivrsNumber?.trim(),

    tariff: row.tariff?.trim(),

    msn: row.msn?.trim(),

    phase: row.phase?.trim(),

    eventClassificationName: row.eventClassificationName?.trim(),

    eventId: Number(row.eventId),

    eventName: row.eventName?.trim(),

    eventCount: Number(row.eventCount),

    durationHhMm: row.durationHhMm?.trim(),
  }));
}
