import { expect } from "@playwright/test";
import type { CreateMeterRequestBody } from "../Data/create-meter.data";
import {
  CREATE_METER_DLMS_VALUES,
  CREATE_METER_FIELD_LIMITS,
  createMeterExpectedSuccessMessage,
} from "../Data/create-meter.data";
import {
  CREATE_METER_SUCCESS_FIELDS,
  CreateMeterMapped,
  CreateMeterResponseData,
  CreateMeterScenario,
  REQUEST_ECHO_FIELDS,
} from "../Mapper/create-meter.mapper";

const KNOWN_ERROR_CODES = [
  "METER_ALREADY_EXISTS",
  "DEVICE_MANUFACTURER_NOT_FOUND",
  "VALIDATION_ERROR",
] as const;

const ISO_DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export class CreateMeterValidator {
  validateResponse(mapped: CreateMeterMapped): void {
    expect(mapped).toBeDefined();
  }

  validateCreateSuccess(mapped: CreateMeterMapped): void {
    expect(mapped.isCreateSuccess).toBeTruthy();
    expect(mapped.data).not.toBeNull();
  }

  validateSuccessMessage(mapped: CreateMeterMapped): void {
    expect(mapped.message).toBe(createMeterExpectedSuccessMessage);
  }

  validateRootStructure(data: CreateMeterResponseData): void {
    expect(data).toBeDefined();
    expect(typeof data).toBe("object");
  }

  validateRequiredResponseFields(data: CreateMeterResponseData): void {
    CREATE_METER_SUCCESS_FIELDS.forEach((field) => {
      expect(data).toHaveProperty(field);
    });
  }

  validatePositiveIds(data: CreateMeterResponseData): void {
    expect(data.meterTblRefId).toBeGreaterThan(0);
    expect(data.meterLookupTblRefId).toBeGreaterThan(0);
    expect(data.deviceManufacturerTblRefId).toBeGreaterThan(0);
    expect(data.meterModelTblRefId).toBeGreaterThan(0);
  }

  validateStringFields(data: CreateMeterResponseData): void {
    const stringFields = [
      "meterSerialNumber",
      "meterRapdrpCode",
      "assetId",
      "dlmsNonDlms",
    ] as const;

    stringFields.forEach((field) => {
      expect(typeof data[field]).toBe("string");
      expect(String(data[field]).trim().length).toBeGreaterThan(0);
    });
  }

  validateNumericFields(data: CreateMeterResponseData): void {
    expect(typeof data.mf).toBe("number");
    expect(Number.isFinite(data.mf)).toBeTruthy();
    expect(data.mf).toBeGreaterThan(0);
  }

  validateBooleanFields(data: CreateMeterResponseData): void {
    expect(typeof data.meterStatus).toBe("boolean");
  }

  validateRequestEcho(
    data: CreateMeterResponseData,
    request: CreateMeterRequestBody,
  ): void {
    REQUEST_ECHO_FIELDS.forEach(({ requestKey, responseKey }) => {
      expect(data[responseKey]).toBe(request[requestKey]);
    });
  }

  validateDlmsValue(data: CreateMeterResponseData): void {
    expect([...CREATE_METER_DLMS_VALUES]).toContain(data.dlmsNonDlms);
  }

  validateMatchingAssetAndRapdrp(
    data: CreateMeterResponseData,
    request: CreateMeterRequestBody,
  ): void {
    expect(data.meterSerialNumber).toBe(request.meterSerialNumber);
    expect(data.assetId).toBe(request.meterSerialNumber);
    expect(data.meterRapdrpCode).toBe(request.meterSerialNumber);
    expect(request.meterSerialNumber.length).toBeLessThanOrEqual(
      CREATE_METER_FIELD_LIMITS.meterRapdrpCode,
    );
  }

  validateBackendPersistenceRules(
    data: CreateMeterResponseData,
    request: CreateMeterRequestBody,
  ): void {
    expect(data.meterSerialNumber).toBe(request.meterSerialNumber.trim());
    expect(data.meterRapdrpCode).toBe(request.meterRapdrpCode.trim());
    expect(data.assetId).toBe(request.assetId.trim());
    expect(data.mf).toBe(request.mf);
  }

  validateRequestDateFormat(request: CreateMeterRequestBody): void {
    expect(ISO_DATE_FORMAT.test(request.meterPoDate)).toBeTruthy();
    expect(ISO_DATE_FORMAT.test(request.meterTestingDate)).toBeTruthy();
  }

  validateRequestDateRules(request: CreateMeterRequestBody): void {
    this.validateRequestDateFormat(request);
    const po = new Date(request.meterPoDate);
    const testing = new Date(request.meterTestingDate);
    expect(testing.getTime()).toBeGreaterThanOrEqual(po.getTime());
  }

  validateErrorStructure(mapped: CreateMeterMapped): void {
    expect(mapped.success).toBeFalsy();
    expect(mapped.error).not.toBeNull();
    expect(mapped.error!.code).toBeTruthy();
    expect(mapped.error!.message).toBeTruthy();
    expect(mapped.error!.code.trim().length).toBeGreaterThan(0);
    expect(mapped.error!.message.trim().length).toBeGreaterThan(0);
  }

  validateKnownErrorCode(mapped: CreateMeterMapped): void {
    if (!mapped.error?.code) {
      return;
    }
    expect(KNOWN_ERROR_CODES).toContain(mapped.error.code);
  }

  validateMeterAlreadyExists(mapped: CreateMeterMapped): void {
    expect(mapped.error?.code).toBe("METER_ALREADY_EXISTS");
    expect(mapped.error?.message.toLowerCase()).toContain("exists");
  }

  validateManufacturerNotFound(mapped: CreateMeterMapped): void {
    expect(mapped.error?.code).toBe("DEVICE_MANUFACTURER_NOT_FOUND");
    expect(mapped.error?.message.toLowerCase()).toMatch(/manufacturer|inactive/);
  }

  validateValidationError(mapped: CreateMeterMapped): void {
    expect(mapped.error?.code).toBe("VALIDATION_ERROR");
    expect(mapped.error?.message.trim().length).toBeGreaterThan(0);
  }

  validateValidationFieldHint(
    mapped: CreateMeterMapped,
    validationField?: string,
  ): void {
    if (!validationField) {
      return;
    }
    const message = mapped.error?.message ?? "";
    const fieldErrors = mapped.error?.details?.fieldErrors?.[validationField];
    const hasFieldErrors =
      Array.isArray(fieldErrors) && fieldErrors.length > 0;
    expect(
      message.includes(validationField) || hasFieldErrors,
      `Expected validation error for ${validationField}`,
    ).toBeTruthy();
  }

  validateSuccessBackendRules(
    mapped: CreateMeterMapped,
    request: CreateMeterRequestBody,
  ): void {
    this.validateCreateSuccess(mapped);
    this.validateSuccessMessage(mapped);
    const data = mapped.data!;
    this.validateRootStructure(data);
    this.validateRequiredResponseFields(data);
    this.validatePositiveIds(data);
    this.validateStringFields(data);
    this.validateNumericFields(data);
    this.validateBooleanFields(data);
    this.validateRequestEcho(data, request);
    this.validateDlmsValue(data);
    this.validateBackendPersistenceRules(data, request);
    this.validateRequestDateRules(request);
  }

  validateErrorBackendRules(
    mapped: CreateMeterMapped,
    validationField?: string,
  ): void {
    this.validateErrorStructure(mapped);
    this.validateKnownErrorCode(mapped);
    this.validateValidationError(mapped);
    this.validateValidationFieldHint(mapped, validationField);
  }

  validateScenario(
    mapped: CreateMeterMapped,
    scenario: CreateMeterScenario,
    request: CreateMeterRequestBody,
    validationField?: string,
  ): void {
    switch (scenario) {
      case "success":
      case "success_active_status":
        this.validateSuccessBackendRules(mapped, request);
        break;
      case "success_matching_asset":
        this.validateSuccessBackendRules(mapped, request);
        this.validateMatchingAssetAndRapdrp(mapped.data!, request);
        break;
      case "already_exists":
        this.validateErrorStructure(mapped);
        this.validateKnownErrorCode(mapped);
        this.validateMeterAlreadyExists(mapped);
        break;
      case "manufacturer_not_found":
        this.validateErrorStructure(mapped);
        this.validateKnownErrorCode(mapped);
        this.validateManufacturerNotFound(mapped);
        break;
      case "validation_error":
        this.validateErrorBackendRules(mapped, validationField);
        break;
    }
  }
}
