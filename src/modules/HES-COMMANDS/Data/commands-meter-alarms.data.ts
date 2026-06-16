export const commandsMeterAlarmsData = {
  defaultCount: 10,
  defaultStartId: 1,
  paginationCount: 5,
  paginationStartId: 6,
  invalidCount: 0,
  maxResponseTimeMs: 120_000,
} as const;

export const METER_ALARMS_PATH = "/indore/commands/meter-alarms";

export interface MeterAlarmsRequestBody {
  count: number;
  startId: number;
}

export function buildMeterAlarmsBody(
  overrides: Partial<MeterAlarmsRequestBody> = {},
): MeterAlarmsRequestBody {
  return {
    count: commandsMeterAlarmsData.defaultCount,
    startId: commandsMeterAlarmsData.defaultStartId,
    ...overrides,
  };
}
