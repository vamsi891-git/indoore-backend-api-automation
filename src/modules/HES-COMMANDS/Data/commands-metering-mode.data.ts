import { commandsMeterData } from "./commands-meter.data";
import { commandsJobPollConfig } from "./commands-job-poll.config";

export type MeteringModeCommandType =
  | "metering_mode_get"
  | "metering_mode_set_import_export"
  | "metering_mode_set_import";

export const commandsMeteringModeData = {
  defaultType: "metering_mode_get" as MeteringModeCommandType,
  defaultMeterSerial: commandsMeterData.validMeterSerial,
  unknownMeterSerial: commandsMeterData.unknownMeterSerial,
  maxResponseTimeMs: 120_000,
  ...commandsJobPollConfig,
  expectedInitAction: "GET_CONFIG",
  expectedHesResponseType: "METERING_MODE",
  meteringModes: ["IMPORT", "IMPORT_EXPORT"] as const,
  expectedDisplayLabels: ["Metering Mode"] as const,
  initMessagePattern: /metering mode/i,
  setInitMessagePattern: /metering mode|import/i,
  queryFinishedMessagePattern:
    /job finished|synced from meterStatusForJob|job status fetched successfully/i,
  hesCallbackNotePattern: /final completion status will be delivered via hes callback/i,
} as const;

export const METERING_MODE_PATH = "/indore/commands/metering-mode";

export interface MeteringModeRequestBody {
  type: MeteringModeCommandType;
  /** UI sends a single serial string; API also accepts string[]. */
  meters: string | string[];
  /** Step-up 2FA — required for metering_mode_set_* when 2FA is enabled. */
  otp?: string;
}

export function buildMeteringModeBody(
  overrides: Partial<MeteringModeRequestBody> = {},
): MeteringModeRequestBody {
  return {
    type: commandsMeteringModeData.defaultType,
    meters: commandsMeteringModeData.defaultMeterSerial,
    ...overrides,
  };
}

export function buildMeteringModeSetImportBody(
  overrides: Partial<MeteringModeRequestBody> = {},
): MeteringModeRequestBody {
  return buildMeteringModeBody({
    type: "metering_mode_set_import",
    ...overrides,
  });
}

export function buildMeteringModeSetImportExportBody(
  overrides: Partial<MeteringModeRequestBody> = {},
): MeteringModeRequestBody {
  return buildMeteringModeBody({
    type: "metering_mode_set_import_export",
    ...overrides,
  });
}

/** Parse "Metering Mode: Import" / "Import Export" → IMPORT | IMPORT_EXPORT. */
export function parseMeteringMode(
  meterResponse: string | null | undefined,
): (typeof commandsMeteringModeData.meteringModes)[number] | null {
  const match = /metering mode:\s*([A-Za-z]+(?:[\s_]+[A-Za-z]+)?)/i.exec(meterResponse ?? "");
  if (!match) return null;
  const normalized = match[1].toUpperCase().replace(/[\s]+/g, "_");
  const candidate =
    normalized === "IMPORT_EXPORT" || normalized === "IMPORTEXPORT"
      ? "IMPORT_EXPORT"
      : normalized === "IMPORT"
        ? "IMPORT"
        : null;
  if (
    candidate &&
    commandsMeteringModeData.meteringModes.includes(
      candidate as (typeof commandsMeteringModeData.meteringModes)[number],
    )
  ) {
    return candidate as (typeof commandsMeteringModeData.meteringModes)[number];
  }
  return null;
}

export function pickAlternateMeteringModeSetType(
  current: (typeof commandsMeteringModeData.meteringModes)[number],
): "metering_mode_set_import" | "metering_mode_set_import_export" {
  return current === "IMPORT" ? "metering_mode_set_import_export" : "metering_mode_set_import";
}

export function expectedModeAfterSet(
  setType: "metering_mode_set_import" | "metering_mode_set_import_export",
): (typeof commandsMeteringModeData.meteringModes)[number] {
  return setType === "metering_mode_set_import" ? "IMPORT" : "IMPORT_EXPORT";
}

export function normalizeMeters(meters: string | string[]): string[] {
  return (Array.isArray(meters) ? meters : [meters]).map((m) => m.trim());
}
