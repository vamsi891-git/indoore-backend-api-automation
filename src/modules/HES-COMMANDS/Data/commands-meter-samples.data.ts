export const commandsMeterSamplesData = {
  defaultCount: 10,
  defaultStartId: 1,
  paginationCount: 5,
  paginationStartId: 6,
  invalidCount: 0,
  maxResponseTimeMs: 120_000,
} as const;

export const METER_SAMPLES_PATH = "/indore/commands/meter-samples";

export interface MeterSamplesRequestBody {
  count: number;
  startId: number;
}

export function buildMeterSamplesBody(
  overrides: Partial<MeterSamplesRequestBody> = {},
): MeterSamplesRequestBody {
  return {
    count: commandsMeterSamplesData.defaultCount,
    startId: commandsMeterSamplesData.defaultStartId,
    ...overrides,
  };
}
