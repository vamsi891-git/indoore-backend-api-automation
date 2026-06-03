export interface EventReport {
  circle: string;

  eventId: number;

  eventName: string;

  meterCount: number;

  eventCount: number;

  durationHhMm: string;

  slNo: number;
}

export interface EventReportData {
  fromDate: string;

  toDate: string;

  scopedMeterCount: number;

  items: EventReport[];
}

export interface EventReportResponse {
  success: boolean;

  data: EventReportData;
}

export function mapEventReportResponse(
  response: EventReportResponse,
): EventReport[] {
  return response.data.items.map((row) => ({
    circle: row.circle?.trim(),

    eventId: row.eventId,

    eventName: row.eventName?.trim(),

    meterCount: row.meterCount,

    eventCount: row.eventCount,

    durationHhMm: row.durationHhMm,

    slNo: row.slNo,
  }));
}
