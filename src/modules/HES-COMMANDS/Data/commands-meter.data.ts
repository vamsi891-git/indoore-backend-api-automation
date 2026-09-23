export const commandsMeterData = {
  /** In-scope meter serial for API smoke (override via VALID_METER_SERIAL). */
  validMeterSerial: process.env.VALID_METER_SERIAL?.trim() || "99751580",
  /** Serial not expected to resolve via API. */
  unknownMeterSerial: "00000000000",
  maxResponseTimeMs: 60_000,
} as const;

/** Column headers for GET /indore/commands/meters/:serial `data`. */
export const EXPECTED_COMMANDS_METER_COLUMNS = [
  "meterLookupId",
  "meterSerialNumber",
  "consumerName",
  "phase",
  "ivrsNumber",
  "meterMake",
  "feeder",
  "dtr",
] as const;

/** Column headers for GET /indore/commands/meter-info/:serial `data`. */
export const EXPECTED_COMMANDS_METER_INFO_COLUMNS = [
  "meterId",
  "nodeId",
  "vendor",
  "firmwareVersion",
  "hardwareVersion",
  "createTime",
  "updateTime",
] as const;

export function buildCommandsMeterPath(serial: string): string {
  return `/indore/commands/meters/${encodeURIComponent(serial.trim())}`;
}

export function buildCommandsMeterInfoPath(serial: string): string {
  return `/indore/commands/meter-info/${encodeURIComponent(serial.trim())}`;
}
