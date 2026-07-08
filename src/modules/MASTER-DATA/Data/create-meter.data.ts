import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { CreateMeterScenario } from "../Mapper/create-meter.mapper";
import {
  getCreateMeterDeviceManufacturerId,
  getCreateMeterModelId,
} from "../utils/meter-manufacturer.helper";
import { getValidateMeterSerial } from "../utils/validate-meter-runtime.helper";

export const createMeterMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const createMeterExpectedSuccessMessage = "Meter created successfully";

/** Manual doc + backend createMeterBodySchema field limits. */
export const CREATE_METER_FIELD_LIMITS = {
  meterRapdrpCode: 16,
  assetId: 16,
  accuracyClass: 8,
  meterPoNumber: 32,
  meterVersion: 32,
  meterRating: 15,
} as const;

/** Manual doc: DLMS / Non-DLMS valid values (backend enum). */
export const CREATE_METER_DLMS_VALUES = ["NA", "DLMS", "Non DLMS"] as const;

export interface CreateMeterRequestBody {
  meterRapdrpCode: string;
  assetId: string;
  meterSerialNumber: string;
  mtr: number;
  mctr: number;
  lptr: number;
  lctr: number;
  mf: number;
  accuracyClass: string;
  meterPoNumber: string;
  meterPoDate: string;
  meterTestingDate: string;
  displayDigitCount: number;
  deviceManufacturerTblRefId: number;
  meterModelTblRefId: number;
  meterVersion: string;
  meterStatus: boolean;
  dlmsNonDlms: string;
  meterRating: string;
}

export interface CreateMeterTestCase {
  testName: string;
  scenario: CreateMeterScenario;
  expectedStatus: number;
  buildPayload: () => CreateMeterRequestBody;
  /** When set, test skips if env var is empty. */
  envKey?: string;
  /** For VALIDATION_ERROR scenarios — expected field hint in error message. */
  validationField?: string;
  tags: string[];
}

function buildBaseTemplate(): Omit<CreateMeterRequestBody, "meterSerialNumber"> {
  return {
  meterRapdrpCode: process.env.CREATE_METER_RAPDRP_CODE?.trim() || "AUTO-RAP",
  assetId: process.env.CREATE_METER_ASSET_ID?.trim() || "AUTO-ASSET",
  mtr: 1,
  mctr: 1,
  lptr: 1,
  lctr: 1,
  mf: 1,
  accuracyClass: "1.0",
  meterPoNumber: "PO-AUTO",
  meterPoDate: "2026-06-01",
  meterTestingDate: "2026-06-15",
  displayDigitCount: 20,
  deviceManufacturerTblRefId: getCreateMeterDeviceManufacturerId(),
  meterModelTblRefId: getCreateMeterModelId(),
  meterVersion: "v1",
  meterStatus: true,
  dlmsNonDlms: "NA",
  meterRating: "10-40A",
  };
}

function uniqueSuffix(): string {
  return String(Date.now());
}

/** ≤16 chars; asset/RAPDRP match serial (manual doc §1). */
function buildMeterSerial(suffix: string = uniqueSuffix()): string {
  const rnd = Math.floor(Math.random() * 10_000);
  const digits = `${suffix}${Date.now()}${rnd}`.replace(/\D/g, "");
  return `M${digits.slice(-11)}`.slice(0, 12);
}

function applySerialToRequest(
  body: CreateMeterRequestBody,
  serial: string,
): CreateMeterRequestBody {
  return {
    ...body,
    meterSerialNumber: serial,
    meterRapdrpCode: serial.slice(0, CREATE_METER_FIELD_LIMITS.meterRapdrpCode),
    assetId: serial.slice(0, CREATE_METER_FIELD_LIMITS.assetId),
    displayDigitCount: Math.min(serial.length, 20),
  };
}

export function buildCreateMeterRequest(
  suffix: string = uniqueSuffix(),
): CreateMeterRequestBody {
  const meterSerialNumber = buildMeterSerial(suffix);
  return applySerialToRequest(
    {
      ...buildBaseTemplate(),
      meterSerialNumber,
    },
    meterSerialNumber,
  );
}

export const createMeterTestCases: CreateMeterTestCase[] = [
  // ─── 1. Meter Identification (manual doc §1) ─────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/add-meter — create meter successfully",
    scenario: "success",
    expectedStatus: 201,
    buildPayload: () => buildCreateMeterRequest(),
    tags: ["@smoke", "@master-data", "@create-meter", "@meter-master"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-meter — asset and RAPDRP match serial",
    scenario: "success_matching_asset",
    expectedStatus: 201,
    buildPayload: () => {
      const serial = buildMeterSerial(uniqueSuffix().slice(-10));
      return applySerialToRequest(buildCreateMeterRequest(serial), serial);
    },
    tags: ["@master-data", "@create-meter", "@meter-master"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-meter — METER_ALREADY_EXISTS",
    scenario: "already_exists",
    expectedStatus: 400,
    envKey: "VALIDATE_ADD_METER_EXISTS_SERIAL",
    buildPayload: () => {
      const serial = getValidateMeterSerial("VALIDATE_ADD_METER_EXISTS_SERIAL");
      return applySerialToRequest(buildCreateMeterRequest("dup"), serial);
    },
    tags: ["@master-data", "@create-meter", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-meter — meter serial required",
    scenario: "validation_error",
    expectedStatus: 400,
    validationField: "meterSerialNumber",
    buildPayload: () => ({
      ...buildCreateMeterRequest("empty-serial"),
      meterSerialNumber: "",
    }),
    tags: ["@master-data", "@create-meter", "@negative"],
  },

  // ─── 2. Meter Master (manual doc §2) ─────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/add-meter — DEVICE_MANUFACTURER_NOT_FOUND",
    scenario: "manufacturer_not_found",
    expectedStatus: 400,
    buildPayload: () => ({
      ...buildCreateMeterRequest(`badmfr-${uniqueSuffix()}`),
      deviceManufacturerTblRefId: 99_999_999,
    }),
    tags: ["@master-data", "@create-meter", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-meter — invalid DLMS / Non-DLMS value",
    scenario: "validation_error",
    expectedStatus: 400,
    validationField: "dlmsNonDlms",
    buildPayload: () => ({
      ...buildCreateMeterRequest(`dlms-${uniqueSuffix()}`),
      dlmsNonDlms: "INVALID",
    }),
    tags: ["@master-data", "@create-meter", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-meter — meter status true accepted",
    scenario: "success_active_status",
    expectedStatus: 201,
    buildPayload: () => ({
      ...buildCreateMeterRequest(`active-${uniqueSuffix()}`),
      meterStatus: true,
    }),
    tags: ["@master-data", "@create-meter"],
  },

  // ─── 3. Meter Configuration (manual doc §3) ──────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/add-meter — MF must be greater than zero",
    scenario: "validation_error",
    expectedStatus: 400,
    validationField: "mf",
    buildPayload: () => ({
      ...buildCreateMeterRequest(`mf-${uniqueSuffix()}`),
      mf: 0,
    }),
    tags: ["@master-data", "@create-meter", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-meter — display digit must be positive",
    scenario: "validation_error",
    expectedStatus: 400,
    validationField: "displayDigitCount",
    buildPayload: () => ({
      ...buildCreateMeterRequest(`digit-${uniqueSuffix()}`),
      displayDigitCount: 0,
    }),
    tags: ["@master-data", "@create-meter", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-meter — MPTR must be non-negative",
    scenario: "validation_error",
    expectedStatus: 400,
    validationField: "mtr",
    buildPayload: () => ({
      ...buildCreateMeterRequest(`mtr-${uniqueSuffix()}`),
      mtr: -1,
    }),
    tags: ["@master-data", "@create-meter", "@negative"],
  },

  // ─── 4. Date Validation (manual doc §4) ──────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/add-meter — valid PO and testing date order",
    scenario: "success",
    expectedStatus: 201,
    buildPayload: () => ({
      ...buildCreateMeterRequest(`dates-${uniqueSuffix()}`),
      meterPoDate: "2026-06-01",
      meterTestingDate: "2026-06-15",
    }),
    tags: ["@master-data", "@create-meter"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-meter — testing date before PO date rejected",
    scenario: "validation_error",
    expectedStatus: 400,
    validationField: "meterTestingDate",
    buildPayload: () => ({
      ...buildCreateMeterRequest(`date-${uniqueSuffix()}`),
      meterPoDate: "2026-06-15",
      meterTestingDate: "2026-06-01",
    }),
    tags: ["@master-data", "@create-meter", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-meter — future PO date rejected",
    scenario: "validation_error",
    expectedStatus: 400,
    validationField: "meterPoDate",
    buildPayload: () => ({
      ...buildCreateMeterRequest(`future-${uniqueSuffix()}`),
      meterPoDate: "2099-01-01",
      meterTestingDate: "2099-01-01",
    }),
    tags: ["@master-data", "@create-meter", "@negative"],
  },

  // ─── 5. Field Length (manual doc §5) ─────────────────────────────────────
  {
    testName:
      "Validate POST /indore/master-data/add-meter — accuracy class max 8 chars",
    scenario: "validation_error",
    expectedStatus: 400,
    validationField: "accuracyClass",
    buildPayload: () => ({
      ...buildCreateMeterRequest(`acc-${uniqueSuffix()}`),
      accuracyClass: "123456789",
    }),
    tags: ["@master-data", "@create-meter", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-meter — PO number max 32 chars",
    scenario: "validation_error",
    expectedStatus: 400,
    validationField: "meterPoNumber",
    buildPayload: () => ({
      ...buildCreateMeterRequest(`po-${uniqueSuffix()}`),
      meterPoNumber: "X".repeat(CREATE_METER_FIELD_LIMITS.meterPoNumber + 1),
    }),
    tags: ["@master-data", "@create-meter", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-meter — meter version max 32 chars",
    scenario: "validation_error",
    expectedStatus: 400,
    validationField: "meterVersion",
    buildPayload: () => ({
      ...buildCreateMeterRequest(`ver-${uniqueSuffix()}`),
      meterVersion: "X".repeat(CREATE_METER_FIELD_LIMITS.meterVersion + 1),
    }),
    tags: ["@master-data", "@create-meter", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-meter — meter rating max 15 chars",
    scenario: "validation_error",
    expectedStatus: 400,
    validationField: "meterRating",
    buildPayload: () => ({
      ...buildCreateMeterRequest(`rate-${uniqueSuffix()}`),
      meterRating: "X".repeat(CREATE_METER_FIELD_LIMITS.meterRating + 1),
    }),
    tags: ["@master-data", "@create-meter", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/master-data/add-meter — missing required fields",
    scenario: "validation_error",
    expectedStatus: 400,
    validationField: "meterRapdrpCode",
    buildPayload: () => ({
      meterRapdrpCode: "",
      assetId: "",
      meterSerialNumber: `M${uniqueSuffix().slice(-10)}`,
      mtr: 0,
      mctr: 0,
      lptr: 0,
      lctr: 0,
      mf: 0,
      accuracyClass: "",
      meterPoNumber: "",
      meterPoDate: "",
      meterTestingDate: "",
      displayDigitCount: 0,
      deviceManufacturerTblRefId: 0,
      meterModelTblRefId: 0,
      meterVersion: "",
      meterStatus: false,
      dlmsNonDlms: "",
      meterRating: "",
    }),
    tags: ["@master-data", "@create-meter", "@negative"],
  },
];
