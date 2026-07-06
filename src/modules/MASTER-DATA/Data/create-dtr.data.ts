import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { CreateDtrScenario } from "../Mapper/create-dtr.mapper";
import {
  hasDtrAssignableMeterPool,
  nextDtrAssignableMeterSerial,
  peekDtrAssignableMeterSerial,
  setDtrAssignableMeterPool,
} from "./dtr-assignable-meter-pool.data";

export const createDtrMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const createDtrExpectedSuccessMessage = "DTR created successfully";

export const CREATE_DTR_NOT_FOUND_MSN = "MSN_INVALID_NONEXISTENT_00000";

export function setResolvedUnmappedMeters(serials: string[]): void {
  setDtrAssignableMeterPool(serials);
}

export function hasResolvedUnmappedMeters(): boolean {
  return hasDtrAssignableMeterPool();
}

export const CREATE_DTR_UNMAPPED_METER_CANDIDATES = [
  "93041027",
  "85092394",
  "85119166",
  "85104185",
  "97788461",
  "85092713",
  "19272589",
  "19272494",
  "85084802",
  "88012235",
] as const;

/** API request uses display field names (same as UI / OpenAPI). */
export interface CreateDtrRequestBody {
  organisationLookupId: number;
  subStationNetworkLookupId: number;
  feederNetworkLookupId: number;
  "DTR Code": string;
  "DTR Name": string;
  "DTR Capacity (KVA)": number;
  Status: string;
  "Service Date": string;
  "Installation Date": string;
  MSN: string;
  "Main/Sub Meter": number;
  "Service Point ID": string;
  "Date Of Service": string;
  "Meter Phase": number;
  "Connected To DCU": boolean;
  "SIM No.": string;
  "IMSI No.": string;
  "Mobile No. (Meter)": string;
  "IP Address": string;
  "Modem Serial Number": string;
  "Modem IMEI": string;
  "Meter Initial Reading": number;
  Latitude: string;
  Longitude: string;
  "DTR Address": string;
  Remarks: string;
}

export interface CreateDtrTestCase {
  testName: string;
  scenario: CreateDtrScenario;
  expectedStatus: number;
  buildPayload: () => CreateDtrRequestBody;
  /** Skip when any listed env var is empty. */
  envKeys?: string[];
  /** VALIDATION_ERROR — API fieldErrors key (display name). */
  validationField?: string;
  tags: string[];
}

export const CREATE_DTR_HIERARCHY_ENV_KEYS = [
  "CREATE_DTR_ORGANISATION_LOOKUP_ID",
  "CREATE_DTR_SUBSTATION_NETWORK_LOOKUP_ID",
  "CREATE_DTR_FEEDER_NETWORK_LOOKUP_ID",
] as const;

function envValue(key: string): string {
  return process.env[key]?.trim() ?? "";
}

function envInt(key: string, fallback: number): number {
  const raw = envValue(key);
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function peekUnmappedMeterSerial(): string {
  const provisioned = peekDtrAssignableMeterSerial();
  if (provisioned) {
    return provisioned;
  }
  const fromEnv = envValue("CREATE_DTR_UNMAPPED_METER_SERIALS");
  if (fromEnv) {
    return fromEnv.split(",")[0]?.trim() ?? CREATE_DTR_NOT_FOUND_MSN;
  }
  return CREATE_DTR_UNMAPPED_METER_CANDIDATES[0];
}

function nextUnmappedMeterSerial(): string {
  const provisioned = nextDtrAssignableMeterSerial({ wrap: false });
  if (provisioned) {
    return provisioned;
  }
  return peekUnmappedMeterSerial();
}

function uniqueLabel(): string {
  return String(Date.now());
}

/** API: alphanumeric, max 16 chars (Bulk upload validations — DTR Code unique). */
function uniqueDtrCode(): string {
  const ts = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return `DTR${ts}`.slice(0, 16);
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function hierarchyFromEnv(): Pick<
  CreateDtrRequestBody,
  | "organisationLookupId"
  | "subStationNetworkLookupId"
  | "feederNetworkLookupId"
> {
  return {
    organisationLookupId: envInt("CREATE_DTR_ORGANISATION_LOOKUP_ID", 0),
    subStationNetworkLookupId: envInt(
      "CREATE_DTR_SUBSTATION_NETWORK_LOOKUP_ID",
      0,
    ),
    feederNetworkLookupId: envInt("CREATE_DTR_FEEDER_NETWORK_LOOKUP_ID", 0),
  };
}

export function buildCreateDtrRequest(
  label: string = uniqueLabel(),
  options?: { msn?: string },
): CreateDtrRequestBody {
  const today = isoToday();
  const msn = options?.msn ?? nextUnmappedMeterSerial();
  const stamp = String(Date.now()).slice(-8);

  return {
    ...hierarchyFromEnv(),
    "DTR Code": uniqueDtrCode(),
    "DTR Name": `Auto DTR ${label}`,
    "DTR Capacity (KVA)": 25,
    Status: "active",
    "Service Date": today,
    "Installation Date": today,
    MSN: msn,
    "Main/Sub Meter": envInt("CREATE_DTR_MAIN_SUB_METER_TBL_REF_ID", 1),
    "Service Point ID": `SP${stamp}`,
    "Date Of Service": today,
    "Meter Phase": envInt("CREATE_DTR_METER_PHASE_TBL_REF_ID", 1),
    "Connected To DCU": true,
    "SIM No.": "9900000001",
    "IMSI No.": "404010123456789",
    "Mobile No. (Meter)": "9876543210",
    "IP Address": "192.168.1.100",
    "Modem Serial Number": `MOD${stamp}`,
    "Modem IMEI": "359072069367200",
    "Meter Initial Reading": 1,
    Latitude: "22.7196",
    Longitude: "75.8577",
    "DTR Address": "Test address",
    Remarks: "Automation create-dtr",
  };
}

const hierarchyEnvKeys = [...CREATE_DTR_HIERARCHY_ENV_KEYS];

export const createDtrTestCases: CreateDtrTestCase[] = [
  // ─── DTR identification (manual §2) ────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — DTR Code required",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "DTR Code",
    buildPayload: () => ({
      ...buildCreateDtrRequest("no-code"),
      "DTR Code": "",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — DTR Name required",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "DTR Name",
    buildPayload: () => ({
      ...buildCreateDtrRequest("no-name"),
      "DTR Name": "",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — DTR Code must be unique",
    scenario: "dtr_code_exists",
    expectedStatus: 409,
    envKeys: [...hierarchyEnvKeys, "CREATE_DTR_EXISTS_CODE"],
    buildPayload: () => ({
      ...buildCreateDtrRequest("exists"),
      "DTR Code": envValue("CREATE_DTR_EXISTS_CODE"),
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — DTR Capacity must be greater than zero",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "DTR Capacity (KVA)",
    buildPayload: () => ({
      ...buildCreateDtrRequest("cap-zero"),
      "DTR Capacity (KVA)": 0,
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — DTR Capacity cannot be negative",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "DTR Capacity (KVA)",
    buildPayload: () => ({
      ...buildCreateDtrRequest("cap-neg"),
      "DTR Capacity (KVA)": -25,
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — Status must be valid",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Status",
    buildPayload: () => ({
      ...buildCreateDtrRequest("bad-status"),
      Status: "MAYBE",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },

  // ─── Date validation (manual §2 / §3) ────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — Service Date must use YYYY-MM-DD",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Service Date",
    buildPayload: () => ({
      ...buildCreateDtrRequest("svc-fmt"),
      "Service Date": "not-a-date",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — Installation Date must use YYYY-MM-DD",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Installation Date",
    buildPayload: () => ({
      ...buildCreateDtrRequest("inst-fmt"),
      "Installation Date": "not-a-date",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — Date Of Service must use YYYY-MM-DD",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Date Of Service",
    buildPayload: () => ({
      ...buildCreateDtrRequest("dos-fmt"),
      "Date Of Service": "not-a-date",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — future Service Date rejected",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Service Date",
    buildPayload: () => ({
      ...buildCreateDtrRequest("svc-future"),
      "Service Date": "2099-01-01",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — future Installation Date rejected",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Installation Date",
    buildPayload: () => ({
      ...buildCreateDtrRequest("inst-future"),
      "Installation Date": "2099-01-01",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — future Date Of Service rejected",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Date Of Service",
    buildPayload: () => ({
      ...buildCreateDtrRequest("dos-future"),
      "Date Of Service": "2099-01-01",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },

  // ─── Meter details (manual §3) ─────────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — MSN required",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "MSN",
    buildPayload: () => ({
      ...buildCreateDtrRequest("no-msn"),
      MSN: "",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — meter must exist",
    scenario: "meter_not_found",
    expectedStatus: 404,
    envKeys: hierarchyEnvKeys,
    buildPayload: () => {
      const missingMsn = `Z${Date.now().toString().slice(-11)}`;
      return {
        ...buildCreateDtrRequest("msn-missing", { msn: missingMsn }),
      };
    },
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — meter must be active",
    scenario: "meter_inactive",
    expectedStatus: 409,
    envKeys: [...hierarchyEnvKeys, "VALIDATE_DTR_METER_INACTIVE_SERIAL"],
    buildPayload: () => ({
      ...buildCreateDtrRequest("msn-inactive"),
      MSN: envValue("VALIDATE_DTR_METER_INACTIVE_SERIAL"),
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — meter already on another DTR",
    scenario: "meter_on_dtr",
    expectedStatus: 409,
    envKeys: [...hierarchyEnvKeys, "VALIDATE_DTR_METER_ON_DTR_SERIAL"],
    buildPayload: () => ({
      ...buildCreateDtrRequest("msn-on-dtr"),
      MSN: envValue("VALIDATE_DTR_METER_ON_DTR_SERIAL"),
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — meter already assigned to consumer",
    scenario: "meter_assigned",
    expectedStatus: 409,
    envKeys: [...hierarchyEnvKeys, "VALIDATE_DTR_METER_ASSIGNED_SERIAL"],
    buildPayload: () => ({
      ...buildCreateDtrRequest("msn-assigned"),
      MSN: envValue("VALIDATE_DTR_METER_ASSIGNED_SERIAL"),
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — Main/Sub Meter must be valid",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Main/Sub Meter",
    buildPayload: () => ({
      ...buildCreateDtrRequest("bad-main-sub"),
      "Main/Sub Meter": 99_999_999,
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — Meter Phase must be valid",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Meter Phase",
    buildPayload: () => ({
      ...buildCreateDtrRequest("bad-phase"),
      "Meter Phase": 99_999_999,
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — IMSI No. must contain digits only",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "IMSI No.",
    buildPayload: () => ({
      ...buildCreateDtrRequest("bad-imsi"),
      "IMSI No.": "IMSI-ABC123",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — Mobile No. (Meter) must contain digits only",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Mobile No. (Meter)",
    buildPayload: () => ({
      ...buildCreateDtrRequest("bad-mobile"),
      "Mobile No. (Meter)": "abc",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — IP Address must be valid IPv4",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "IP Address",
    buildPayload: () => ({
      ...buildCreateDtrRequest("bad-ip"),
      "IP Address": "999.999.999.999",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — Modem IMEI must be 15 digits",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Modem IMEI",
    buildPayload: () => ({
      ...buildCreateDtrRequest("bad-imei"),
      "Modem IMEI": "12345",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — Meter Initial Reading must be greater than zero",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Meter Initial Reading",
    buildPayload: () => ({
      ...buildCreateDtrRequest("reading-zero"),
      "Meter Initial Reading": 0,
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },

  // ─── Additional details (manual §4) ──────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — Latitude must be a valid number",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Latitude",
    buildPayload: () => ({
      ...buildCreateDtrRequest("bad-lat"),
      Latitude: "bad",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — Longitude must be a valid number",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Longitude",
    buildPayload: () => ({
      ...buildCreateDtrRequest("bad-lon"),
      Longitude: "bad",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },

  // ─── Success (last — consumes a provisioned meter) ─────────────────────
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — create DTR successfully",
    scenario: "success",
    expectedStatus: 201,
    envKeys: [...hierarchyEnvKeys],
    buildPayload: () => buildCreateDtrRequest("success"),
    tags: ["@smoke", "@master-data", "@create-dtr", "@dtr-master"],
  },
];
