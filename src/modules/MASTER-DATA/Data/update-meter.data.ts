import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import {
  CREATE_METER_DLMS_VALUES,
  CREATE_METER_FIELD_LIMITS,
  buildCreateMeterRequest,
  type CreateMeterRequestBody,
} from "./create-meter.data";
import type { UpdateMeterScenario } from "../Mapper/update-meter.mapper";

export const updateMeterMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;
export const updateMeterExpectedSuccessMessage = "Meter updated successfully";
export const UPDATE_METER_DLMS_VALUES = CREATE_METER_DLMS_VALUES;
export const UPDATE_METER_FIELD_LIMITS = CREATE_METER_FIELD_LIMITS;

export interface UpdateMeterRequestBody extends CreateMeterRequestBody {
  isActiveStatus: boolean;
}

export interface UpdateMeterTestCase {
  testName: string;
  scenario: UpdateMeterScenario;
  expectedStatus: number;
  /** When true, create a meter first and use its meterLookupTblRefId. */
  provisionMeter: boolean;
  /** Fixed path id for not-found scenarios. */
  meterLookupTblRefId?: number;
  buildPayload: (base?: CreateMeterRequestBody) => UpdateMeterRequestBody;
  validationField?: string;
  tags: string[];
}

export function toUpdateMeterPayload(
  base: CreateMeterRequestBody,
  overrides: Partial<UpdateMeterRequestBody> = {},
): UpdateMeterRequestBody {
  return {
    ...base,
    isActiveStatus: true,
    meterPoNumber: "PO-UPD-001",
    meterVersion: "v2",
    ...overrides,
  };
}

export const updateMeterTestCases: UpdateMeterTestCase[] = [
  {
    testName:
      "Validate PUT /indore/master-data/meters/:id — update meter successfully",
    scenario: "success",
    expectedStatus: 200,
    provisionMeter: true,
    buildPayload: (base) =>
      toUpdateMeterPayload(base!, {
        meterPoNumber: "PO-UPD-001",
        meterVersion: "v2",
        accuracyClass: "1",
        meterRating: "1",
        isActiveStatus: true,
      }),
    tags: ["@smoke", "@master-data", "@update-meter", "@meter-master"],
  },
  {
    testName:
      "Validate PUT /indore/master-data/meters/:id — set isActiveStatus false",
    scenario: "success_toggle_inactive",
    expectedStatus: 200,
    provisionMeter: true,
    buildPayload: (base) =>
      toUpdateMeterPayload(base!, {
        isActiveStatus: false,
        meterStatus: false,
      }),
    tags: ["@master-data", "@update-meter", "@meter-master"],
  },
  {
    testName:
      "Validate PUT /indore/master-data/meters/:id — meter not found / out of scope",
    scenario: "not_found",
    expectedStatus: 400,
    provisionMeter: false,
    meterLookupTblRefId: 999_999_999,
    buildPayload: () => toUpdateMeterPayload(buildCreateMeterRequest("nf")),
    validationField: "meterLookupTblRefId",
    tags: ["@master-data", "@update-meter", "@negative"],
  },
  {
    testName:
      "Validate PUT /indore/master-data/meters/:id — DEVICE_MANUFACTURER_NOT_FOUND",
    scenario: "manufacturer_not_found",
    expectedStatus: 400,
    provisionMeter: true,
    buildPayload: (base) =>
      toUpdateMeterPayload(base!, {
        deviceManufacturerTblRefId: 99_999_999,
      }),
    tags: ["@master-data", "@update-meter", "@negative"],
  },
  {
    testName:
      "Validate PUT /indore/master-data/meters/:id — MF must be greater than zero",
    scenario: "validation_error",
    expectedStatus: 400,
    provisionMeter: true,
    validationField: "mf",
    buildPayload: (base) => toUpdateMeterPayload(base!, { mf: 0 }),
    tags: ["@master-data", "@update-meter", "@negative"],
  },
  {
    testName:
      "Validate PUT /indore/master-data/meters/:id — invalid DLMS / Non-DLMS value",
    scenario: "validation_error",
    expectedStatus: 400,
    provisionMeter: true,
    validationField: "dlmsNonDlms",
    buildPayload: (base) =>
      toUpdateMeterPayload(base!, { dlmsNonDlms: "INVALID" }),
    tags: ["@master-data", "@update-meter", "@negative"],
  },
  {
    testName:
      "Validate PUT /indore/master-data/meters/:id — empty meter serial rejected",
    scenario: "validation_error",
    expectedStatus: 400,
    provisionMeter: true,
    validationField: "meterSerialNumber",
    buildPayload: (base) =>
      toUpdateMeterPayload(base!, { meterSerialNumber: "" }),
    tags: ["@master-data", "@update-meter", "@negative"],
  },
  {
    testName:
      "Validate PUT /indore/master-data/meters/:id — display digit must be positive",
    scenario: "validation_error",
    expectedStatus: 400,
    provisionMeter: true,
    validationField: "displayDigitCount",
    buildPayload: (base) =>
      toUpdateMeterPayload(base!, { displayDigitCount: 0 }),
    tags: ["@master-data", "@update-meter", "@negative"],
  },
  {
    testName:
      "Validate PUT /indore/master-data/meters/:id — accuracy class max 8 chars",
    scenario: "validation_error",
    expectedStatus: 400,
    provisionMeter: true,
    validationField: "accuracyClass",
    buildPayload: (base) =>
      toUpdateMeterPayload(base!, { accuracyClass: "123456789" }),
    tags: ["@master-data", "@update-meter", "@negative"],
  },
];
