import { expect } from "@playwright/test";
import type { UpdateMeterRequestBody } from "../Data/update-meter.data";
import {
  UPDATE_METER_DLMS_VALUES,
  updateMeterExpectedSuccessMessage,
} from "../Data/update-meter.data";
import {
  UPDATE_METER_SUCCESS_FIELDS,
  UPDATE_REQUEST_ECHO_FIELDS,
  UpdateMeterMapped,
  UpdateMeterResponseData,
  UpdateMeterScenario,
} from "../Mapper/update-meter.mapper";

const KNOWN_ERROR_CODES = [
  "METER_ALREADY_EXISTS",
  "DEVICE_MANUFACTURER_NOT_FOUND",
  "VALIDATION_ERROR",
  "NOT_FOUND",
] as const;

export class UpdateMeterValidator {
  validateResponse(mapped: UpdateMeterMapped): void {
    expect(mapped).toBeDefined();
  }

  validateUpdateSuccess(mapped: UpdateMeterMapped): void {
    expect(mapped.isUpdateSuccess).toBeTruthy();
    expect(mapped.data).not.toBeNull();
  }

  validateSuccessMessage(mapped: UpdateMeterMapped): void {
    expect(mapped.message).toBe(updateMeterExpectedSuccessMessage);
  }

  validateRootStructure(data: UpdateMeterResponseData): void {
    expect(data).toBeDefined();
    expect(typeof data).toBe("object");
  }

  validateRequiredResponseFields(data: UpdateMeterResponseData): void {
    UPDATE_METER_SUCCESS_FIELDS.forEach((field) => {
      expect(data).toHaveProperty(field);
    });
  }

  validatePositiveIds(data: UpdateMeterResponseData): void {
    expect(data.meterTblRefId).toBeGreaterThan(0);
    expect(data.meterLookupTblRefId).toBeGreaterThan(0);
    expect(data.deviceManufacturerTblRefId).toBeGreaterThan(0);
    expect(data.meterModelTblRefId).toBeGreaterThan(0);
  }

  validateStringFields(data: UpdateMeterResponseData): void {
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

  validateNumericFields(data: UpdateMeterResponseData): void {
    expect(typeof data.mf).toBe("number");
    expect(Number.isFinite(data.mf)).toBeTruthy();
    expect(data.mf).toBeGreaterThan(0);
  }

  validateBooleanFields(data: UpdateMeterResponseData): void {
    expect(typeof data.meterStatus).toBe("boolean");
    expect(typeof data.isActiveStatus).toBe("boolean");
  }

  validateRequestEcho(
    data: UpdateMeterResponseData,
    request: UpdateMeterRequestBody,
  ): void {
    UPDATE_REQUEST_ECHO_FIELDS.forEach(({ requestKey, responseKey }) => {
      expect(data[responseKey]).toBe(request[requestKey]);
    });
  }

  validateDlmsValue(data: UpdateMeterResponseData): void {
    expect([...UPDATE_METER_DLMS_VALUES]).toContain(data.dlmsNonDlms);
  }

  validateLookupIdEcho(
    data: UpdateMeterResponseData,
    meterLookupTblRefId: number,
  ): void {
    expect(data.meterLookupTblRefId).toBe(meterLookupTblRefId);
  }

  validateErrorStructure(mapped: UpdateMeterMapped): void {
    expect(mapped.success).toBeFalsy();
    expect(mapped.error).not.toBeNull();
    expect(mapped.error!.code).toBeTruthy();
    expect(mapped.error!.message).toBeTruthy();
  }

  validateKnownErrorCode(mapped: UpdateMeterMapped): void {
    if (!mapped.error?.code) {
      return;
    }
    expect(KNOWN_ERROR_CODES).toContain(mapped.error.code);
  }

  validateNotFound(mapped: UpdateMeterMapped): void {
    const code = mapped.error?.code ?? "";
    const message = mapped.error?.message.toLowerCase() ?? "";
    const fieldErrors =
      mapped.error?.details?.fieldErrors?.meterLookupTblRefId ?? [];
    expect(
      code === "VALIDATION_ERROR" ||
        code === "NOT_FOUND" ||
        message.includes("not found") ||
        fieldErrors.length > 0,
    ).toBeTruthy();
  }

  validateManufacturerNotFound(mapped: UpdateMeterMapped): void {
    const code = mapped.error?.code ?? "";
    const message = mapped.error?.message.toLowerCase() ?? "";
    if (code === "VALIDATION_ERROR") {
      expect(message).toMatch(/manufacturer|invalid|not found|inactive/);
      return;
    }
    expect(code).toBe("DEVICE_MANUFACTURER_NOT_FOUND");
  }

  validateValidationError(mapped: UpdateMeterMapped): void {
    expect(mapped.error?.code).toBe("VALIDATION_ERROR");
    expect(mapped.error?.message.trim().length).toBeGreaterThan(0);
  }

  validateValidationFieldHint(
    mapped: UpdateMeterMapped,
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
    mapped: UpdateMeterMapped,
    request: UpdateMeterRequestBody,
    meterLookupTblRefId: number,
  ): void {
    this.validateUpdateSuccess(mapped);
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
    this.validateLookupIdEcho(data, meterLookupTblRefId);
  }

  validateErrorBackendRules(
    mapped: UpdateMeterMapped,
    validationField?: string,
  ): void {
    expect(
      mapped.isUpdateSuccess,
      "HTTP 200 / success=true with data — backend accepted invalid payload",
    ).toBe(false);
    this.validateErrorStructure(mapped);
    this.validateKnownErrorCode(mapped);
    this.validateValidationError(mapped);
    this.validateValidationFieldHint(mapped, validationField);
  }

  validateScenario(
    mapped: UpdateMeterMapped,
    scenario: UpdateMeterScenario,
    request: UpdateMeterRequestBody,
    meterLookupTblRefId: number,
    validationField?: string,
  ): void {
    switch (scenario) {
      case "success":
      case "success_toggle_inactive":
        this.validateSuccessBackendRules(
          mapped,
          request,
          meterLookupTblRefId,
        );
        break;
      case "not_found":
        this.validateErrorStructure(mapped);
        this.validateKnownErrorCode(mapped);
        this.validateNotFound(mapped);
        this.validateValidationFieldHint(mapped, validationField);
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
