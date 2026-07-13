import { randomBytes } from "crypto";
import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { CreateDtrScenario } from "../Mapper/create-dtr.mapper";
import {
  resolveMasterDataEnv,
  resolveMasterDataEnvInt,
} from "../utils/master-data-env.helper";
import { getValidateMeterSerial } from "../utils/validate-meter-runtime.helper";
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

let createDtrExistsCode: string | null = null;

export function setCreateDtrExistsCode(code: string): void {
  const trimmed = code.trim();
  createDtrExistsCode = trimmed || null;
}

export function getCreateDtrExistsCode(): string {
  return createDtrExistsCode ?? resolveMasterDataEnv("CREATE_DTR_EXISTS_CODE");
}

export function hasCreateDtrExistsCode(): boolean {
  return getCreateDtrExistsCode().length > 0;
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
  /** When the API may return more than one rejection status (e.g. 400 vs 409). */
  acceptableStatuses?: number[];
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

let dtrCodeSequence = 0;

/** API: alphanumeric, max 16 chars — keep suffix unique when truncated. */
function uniqueDtrCode(): string {
  dtrCodeSequence += 1;
  const tail = `${Date.now()}${dtrCodeSequence}${Math.floor(Math.random() * 100)}`.slice(-13);
  return `DTR${tail}`.slice(0, 16);
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function hashSeed(seed: string): number {
  let hash = 2_166_136_261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 1_677_761_9);
  }
  return hash >>> 0;
}

function uniqueFifteenDigitId(seed: string): string {
  const digits = `${seed}${Date.now()}${Math.floor(Math.random() * 10000)}`.replace(
    /\D/g,
    "",
  );
  return digits.padEnd(15, "7").slice(0, 15);
}

/** Per-request modem identity — hardcoded SIM/IP/IMEI caused 409 collisions in CI. */
function uniqueModemFields(seed: string): {
  servicePointId: string;
  simNumber: string;
  imsiNumber: string;
  mobileNumber: string;
  ipAddress: string;
  modemSerial: string;
  modemImei: string;
} {
  const nonce = randomBytes(6).toString("hex");
  const identitySeed = `${seed}-${nonce}`;
  const hash = hashSeed(identitySeed);
  return {
    servicePointId: `SP${hash.toString(36)}${nonce}`.slice(0, 24),
    simNumber: `99${String(hash % 100_000_000).padStart(8, "0")}`,
    imsiNumber: uniqueFifteenDigitId(`imsi-${identitySeed}`),
    mobileNumber: `9${String((hash % 1_000_000_000) + 100_000_000).slice(0, 9)}`,
    ipAddress: `10.${20 + (hash % 30)}.${10 + ((hash >>> 8) % 200)}.${10 + ((hash >>> 16) % 200)}`,
    modemSerial: `MOD${nonce}${String(hash % 1_000_000).padStart(6, "0")}`,
    modemImei: uniqueFifteenDigitId(`imei-${identitySeed}`),
  };
}

function hierarchyFromEnv(): Pick<
  CreateDtrRequestBody,
  | "organisationLookupId"
  | "subStationNetworkLookupId"
  | "feederNetworkLookupId"
> {
  return {
    organisationLookupId: resolveMasterDataEnvInt(
      "CREATE_DTR_ORGANISATION_LOOKUP_ID",
      30,
    ),
    subStationNetworkLookupId: resolveMasterDataEnvInt(
      "CREATE_DTR_SUBSTATION_NETWORK_LOOKUP_ID",
      3,
    ),
    feederNetworkLookupId: resolveMasterDataEnvInt(
      "CREATE_DTR_FEEDER_NETWORK_LOOKUP_ID",
      4,
    ),
  };
}

export function buildCreateDtrRequest(
  label: string = uniqueLabel(),
  options?: { msn?: string },
): CreateDtrRequestBody {
  const today = isoToday();
  const msn = options?.msn ?? nextUnmappedMeterSerial();
  const stamp = `${label}${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const modem = uniqueModemFields(`${label}-${msn}-${stamp}`);

  return {
    ...hierarchyFromEnv(),
    "DTR Code": uniqueDtrCode(),
    "DTR Name": `Auto DTR ${stamp}`,
    "DTR Capacity (KVA)": 25,
    Status: "active",
    "Service Date": today,
    "Installation Date": today,
    MSN: msn,
    "Main/Sub Meter": resolveMasterDataEnvInt(
      "CREATE_DTR_MAIN_SUB_METER_TBL_REF_ID",
      1,
    ),
    "Service Point ID": modem.servicePointId,
    "Meter Phase": resolveMasterDataEnvInt("CREATE_DTR_METER_PHASE_TBL_REF_ID", 1),
    "Connected To DCU": true,
    "SIM No.": modem.simNumber,
    "IMSI No.": modem.imsiNumber,
    "Mobile No. (Meter)": modem.mobileNumber,
    "IP Address": modem.ipAddress,
    "Modem Serial Number": modem.modemSerial,
    "Modem IMEI": modem.modemImei,
    "Meter Initial Reading": 1,
    Latitude: `22.${String(710_000 + (hashSeed(stamp) % 90_000)).padStart(6, "0")}`,
    Longitude: `75.${String(850_000 + (hashSeed(`${stamp}-lng`) % 50_000)).padStart(6, "0")}`,
    "DTR Address": `Test address ${stamp.slice(0, 16)}`,
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
    expectedStatus: 400,
    acceptableStatuses: [400, 409],
    envKeys: [...hierarchyEnvKeys, "CREATE_DTR_EXISTS_CODE"],
    buildPayload: () => ({
      ...buildCreateDtrRequest("exists"),
      "DTR Code": getCreateDtrExistsCode(),
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
    tags: ["@master-data", "@create-dtr", "@negative", "@backend-defect"],
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

  // ─── Meter details (manual §2) ─────────────────────────────────────────
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
    expectedStatus: 400,
    acceptableStatuses: [400, 404],
    envKeys: hierarchyEnvKeys,
    buildPayload: () => {
      const missingMsn = `Z${Date.now().toString().slice(-11)}`;
      return {
        ...buildCreateDtrRequest("msn-missing", { msn: missingMsn }),
      };
    },
    tags: ["@master-data", "@create-dtr", "@negative", "@backend-defect"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — meter must be active",
    scenario: "meter_inactive",
    expectedStatus: 409,
    acceptableStatuses: [400, 409],
    envKeys: hierarchyEnvKeys,
    buildPayload: () => ({
      ...buildCreateDtrRequest("msn-inactive"),
      MSN: getValidateMeterSerial("VALIDATE_DTR_METER_INACTIVE_SERIAL"),
    }),
    tags: ["@master-data", "@create-dtr", "@negative", "@backend-defect"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — meter already on another DTR",
    scenario: "meter_on_dtr",
    expectedStatus: 400,
    acceptableStatuses: [400, 409],
    envKeys: hierarchyEnvKeys,
    buildPayload: () => ({
      ...buildCreateDtrRequest("msn-on-dtr"),
      MSN: getValidateMeterSerial("VALIDATE_DTR_METER_ON_DTR_SERIAL"),
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — meter already assigned to consumer",
    scenario: "meter_assigned",
    expectedStatus: 400,
    acceptableStatuses: [400, 409],
    envKeys: hierarchyEnvKeys,
    buildPayload: () => ({
      ...buildCreateDtrRequest("msn-assigned"),
      MSN: getValidateMeterSerial("VALIDATE_DTR_METER_ASSIGNED_SERIAL"),
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
    tags: ["@master-data", "@create-dtr", "@negative", "@backend-defect"],
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
    tags: ["@master-data", "@create-dtr", "@negative", "@backend-defect"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — Service Point ID required",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Service Point ID",
    buildPayload: () => ({
      ...buildCreateDtrRequest("no-sp"),
      "Service Point ID": "",
    }),
    tags: ["@master-data", "@create-dtr", "@negative"],
  },

  // ─── Communication (manual §3) ───────────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/add-dtr — SIM No. required",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "SIM No.",
    buildPayload: () => ({
      ...buildCreateDtrRequest("no-sim"),
      "SIM No.": "",
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
      "Validate POST /indore/master-data/add-dtr — Modem Serial Number required",
    scenario: "validation_error",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Modem Serial Number",
    buildPayload: () => ({
      ...buildCreateDtrRequest("no-modem"),
      "Modem Serial Number": "",
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
    tags: ["@master-data", "@create-dtr", "@negative", "@backend-defect"],
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
    tags: ["@master-data", "@create-dtr", "@negative", "@backend-defect"],
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
