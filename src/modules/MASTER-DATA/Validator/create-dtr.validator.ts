import { expect } from "@playwright/test";
import type { CreateDtrRequestBody } from "../Data/create-dtr.data";
import { createDtrExpectedSuccessMessage } from "../Data/create-dtr.data";
import {
  CREATE_DTR_SUCCESS_FIELDS,
  CreateDtrMapped,
  CreateDtrResponseData,
  CreateDtrScenario,
  REQUEST_ECHO_FIELDS,
} from "../Mapper/create-dtr.mapper";

const KNOWN_ERROR_CODES = [
  "VALIDATION_ERROR",
  "DTR_CODE_EXISTS",
  "DTR_CODE_ALREADY_EXISTS",
  "DTR_ALREADY_EXISTS",
  "METER_NOT_FOUND",
  "METER_INACTIVE",
  "METER_ALREADY_ON_DTR",
  "METER_ALREADY_ON_DTRS",
  "METER_ALREADY_ASSIGNED",
] as const;

const ISO_DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

/** API fieldErrors keys / message fragments that satisfy a manual validation field hint. */
const VALIDATION_FIELD_HINT_ALIASES: Record<string, RegExp[]> = {
  "Installation Date": [
    /installation\s*date/i,
    /entry\s*date/i,
    /invalid date/i,
    /future/i,
  ],
  "Service Date": [/service\s*date/i, /invalid date/i, /future/i],
};

export class CreateDtrValidator {
  validateResponse(mapped: CreateDtrMapped): void {
    expect(mapped).toBeDefined();
  }

  validateCreateSuccess(mapped: CreateDtrMapped): void {
    expect(
      mapped.isCreateSuccess,
      "Backend must not accept invalid DTR payload (success must be true with data)",
    ).toBeTruthy();
    expect(mapped.data).not.toBeNull();
  }

  validateSuccessMessage(mapped: CreateDtrMapped): void {
    expect(mapped.message).toBe(createDtrExpectedSuccessMessage);
  }

  validateRootStructure(data: CreateDtrResponseData): void {
    expect(data).toBeDefined();
    expect(typeof data).toBe("object");
  }

  validateRequiredResponseFields(data: CreateDtrResponseData): void {
    CREATE_DTR_SUCCESS_FIELDS.forEach((field) => {
      expect(data).toHaveProperty(field);
    });
  }

  validatePositiveIds(data: CreateDtrResponseData): void {
    expect(data.networkLookupId).toBeGreaterThan(0);
    expect(data.meterLookupId).toBeGreaterThan(0);
    expect(data.organisationLookupId).toBeGreaterThan(0);
    expect(data.feederNetworkLookupId).toBeGreaterThan(0);
    expect(data.subStationNetworkLookupId).toBeGreaterThan(0);
  }

  validateStringFields(data: CreateDtrResponseData): void {
    expect(data["DTR Code"].trim().length).toBeGreaterThan(0);
    expect(data["DTR Name"].trim().length).toBeGreaterThan(0);
    expect(data.Status.trim().length).toBeGreaterThan(0);
    expect(data.MSN.trim().length).toBeGreaterThan(0);
  }

  validateNumericFields(data: CreateDtrResponseData): void {
    expect(typeof data["DTR Capacity (KVA)"]).toBe("number");
    expect(data["DTR Capacity (KVA)"]).toBeGreaterThan(0);
  }

  validateRequestEcho(
    data: CreateDtrResponseData,
    request: CreateDtrRequestBody,
  ): void {
    const numericEchoFields = new Set(["Latitude", "Longitude"]);
    REQUEST_ECHO_FIELDS.forEach(({ requestKey, responseKey }) => {
      const expected = request[requestKey];
      const actual = data[responseKey];
      if (expected === "" || expected == null) {
        return;
      }
      if (actual === "" || actual == null || actual === undefined) {
        return;
      }
      if (numericEchoFields.has(responseKey)) {
        expect(Number(actual)).toBe(Number(expected));
        return;
      }
      expect(actual).toBe(expected);
    });
  }

  validateHierarchyEcho(
    data: CreateDtrResponseData,
    request: CreateDtrRequestBody,
  ): void {
    expect(data.organisationLookupId).toBe(request.organisationLookupId);
    expect(data.feederNetworkLookupId).toBe(request.feederNetworkLookupId);
    expect(data.subStationNetworkLookupId).toBe(
      request.subStationNetworkLookupId,
    );
  }

  validateRequestDateFormat(request: CreateDtrRequestBody): void {
    for (const field of ["Service Date", "Installation Date"] as const) {
      expect(ISO_DATE_FORMAT.test(request[field])).toBeTruthy();
    }
  }

  validateErrorStructure(mapped: CreateDtrMapped): void {
    expect(mapped.success).toBeFalsy();
    expect(mapped.error).not.toBeNull();
    expect(mapped.error!.code).toBeTruthy();
    expect(mapped.error!.message).toBeTruthy();
  }

  validateKnownErrorCode(mapped: CreateDtrMapped): void {
    if (!mapped.error?.code) {
      return;
    }
    expect(KNOWN_ERROR_CODES).toContain(mapped.error.code);
  }

  validateValidationError(mapped: CreateDtrMapped): void {
    expect(mapped.error?.code).toBe("VALIDATION_ERROR");
    expect(mapped.error?.message.trim().length).toBeGreaterThan(0);
  }

  validateValidationFieldHint(
    mapped: CreateDtrMapped,
    validationField?: string,
  ): void {
    if (!validationField) {
      return;
    }
    const message = mapped.error?.message ?? "";
    const fieldErrors = mapped.error?.details?.fieldErrors ?? {};
    const formErrors = mapped.error?.details?.formErrors ?? [];
    const normalizedField = validationField.toLowerCase();
    const hasFieldErrors = Object.entries(fieldErrors).some(
      ([key, errors]) =>
        key.toLowerCase() === normalizedField &&
        Array.isArray(errors) &&
        errors.length > 0,
    );
    const formErrorMatch = formErrors.some((entry) =>
      entry.toLowerCase().includes(normalizedField),
    );
    const aliasMatch = (VALIDATION_FIELD_HINT_ALIASES[validationField] ?? []).some(
      (pattern) => pattern.test(message),
    );
    expect(
      message.toLowerCase().includes(normalizedField) ||
        hasFieldErrors ||
        formErrorMatch ||
        aliasMatch,
      `Expected validation error for ${validationField}`,
    ).toBeTruthy();
  }

  validateDtrCodeExists(mapped: CreateDtrMapped): void {
    const code = mapped.error?.code ?? "";
    const message = mapped.error?.message.toLowerCase() ?? "";
    if (code === "VALIDATION_ERROR") {
      expect(message).toMatch(/exist|unique|duplicate|dtr|already|meter/);
      return;
    }
    expect(code).toMatch(/DTR.*EXISTS|ALREADY_EXISTS|METER_ALREADY_ON_DTR/i);
    expect(message).toMatch(/exist|unique|duplicate|dtr|already|meter/);
  }

  validateMeterNotFound(mapped: CreateDtrMapped): void {
    const code = mapped.error?.code ?? "";
    const message = mapped.error?.message.toLowerCase() ?? "";
    if (code === "VALIDATION_ERROR") {
      expect(message).toMatch(/meter|exist|not found|msn/);
      return;
    }
    expect(code).toBe("METER_NOT_FOUND");
    expect(message).toMatch(/meter|exist|not found/);
  }

  validateMeterInactive(mapped: CreateDtrMapped): void {
    const code = mapped.error?.code ?? "";
    const message = mapped.error?.message.toLowerCase() ?? "";
    if (code === "VALIDATION_ERROR") {
      expect(message).toMatch(/inactive|active|meter/);
      return;
    }
    expect(code).toBe("METER_INACTIVE");
    expect(message).toMatch(/inactive|active/);
  }

  validateMeterOnDtr(mapped: CreateDtrMapped): void {
    const code = mapped.error?.code ?? "";
    const message = mapped.error?.message.toLowerCase() ?? "";
    if (code === "VALIDATION_ERROR") {
      expect(message).toMatch(/dtr|mapped|already|meter/);
      return;
    }
    expect(["METER_ALREADY_ON_DTR", "METER_ALREADY_ON_DTRS"]).toContain(code);
    expect(message).toMatch(/dtr|mapped|already/);
  }

  validateMeterAssigned(mapped: CreateDtrMapped): void {
    const code = mapped.error?.code ?? "";
    const message = mapped.error?.message.toLowerCase() ?? "";
    if (code === "VALIDATION_ERROR") {
      expect(message).toMatch(/assign|consumer|meter|already/);
      return;
    }
    expect(code).toBe("METER_ALREADY_ASSIGNED");
    expect(message).toMatch(/assign|consumer/);
  }

  validateSuccessBackendRules(
    mapped: CreateDtrMapped,
    request: CreateDtrRequestBody,
  ): void {
    this.validateCreateSuccess(mapped);
    this.validateSuccessMessage(mapped);
    const data = mapped.data!;
    this.validateRootStructure(data);
    this.validateRequiredResponseFields(data);
    this.validatePositiveIds(data);
    this.validateStringFields(data);
    this.validateNumericFields(data);
    this.validateRequestEcho(data, request);
    this.validateHierarchyEcho(data, request);
    this.validateRequestDateFormat(request);
  }

  validateErrorBackendRules(
    mapped: CreateDtrMapped,
    validationField?: string,
  ): void {
    expect(
      mapped.isCreateSuccess,
      "HTTP 201 / success=true with data — backend accepted invalid payload",
    ).toBe(false);
    this.validateErrorStructure(mapped);
    this.validateKnownErrorCode(mapped);
    this.validateValidationError(mapped);
    this.validateValidationFieldHint(mapped, validationField);
  }

  validateScenario(
    mapped: CreateDtrMapped,
    scenario: CreateDtrScenario,
    request: CreateDtrRequestBody,
    validationField?: string,
  ): void {
    switch (scenario) {
      case "success":
        this.validateSuccessBackendRules(mapped, request);
        break;
      case "validation_error":
        this.validateErrorBackendRules(mapped, validationField);
        break;
      case "dtr_code_exists":
        this.validateErrorStructure(mapped);
        this.validateKnownErrorCode(mapped);
        this.validateDtrCodeExists(mapped);
        break;
      case "meter_not_found":
        this.validateErrorStructure(mapped);
        this.validateKnownErrorCode(mapped);
        this.validateMeterNotFound(mapped);
        break;
      case "meter_inactive":
        this.validateErrorStructure(mapped);
        this.validateKnownErrorCode(mapped);
        this.validateMeterInactive(mapped);
        break;
      case "meter_on_dtr":
        this.validateErrorStructure(mapped);
        this.validateKnownErrorCode(mapped);
        this.validateMeterOnDtr(mapped);
        break;
      case "meter_assigned":
        this.validateErrorStructure(mapped);
        this.validateKnownErrorCode(mapped);
        this.validateMeterAssigned(mapped);
        break;
    }
  }
}
