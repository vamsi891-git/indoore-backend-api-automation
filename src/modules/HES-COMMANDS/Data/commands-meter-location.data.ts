export const commandsMeterLocationData = {
  /** HES node MAC in nodeId; device serial in meterId (search-meters pairing). */
  defaultHesNodeId: "00-1b-c5-0c-60-30-52-26",
  defaultDeviceId: "ABCDEF2400166",
  defaultLatitude: 0,
  defaultLongitude: 0,
  unknownHesNodeId: "00-00-00-00-00-00-00-00",
  invalidLatitude: 999,
  maxResponseTimeMs: 120_000,
} as const;

export const METER_LOCATION_PATH = "/indore/commands/meter-location";

export interface MeterLocationRequestBody {
  nodeId: string;
  meterId: string;
  latitude: number;
  longitude: number;
}

export function buildMeterLocationBody(
  overrides: Partial<MeterLocationRequestBody> = {},
): MeterLocationRequestBody {
  return {
    nodeId: commandsMeterLocationData.defaultHesNodeId,
    meterId: commandsMeterLocationData.defaultDeviceId,
    latitude: commandsMeterLocationData.defaultLatitude,
    longitude: commandsMeterLocationData.defaultLongitude,
    ...overrides,
  };
}
