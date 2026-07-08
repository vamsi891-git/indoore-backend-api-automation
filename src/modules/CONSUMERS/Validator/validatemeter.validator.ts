import { expect } from "@playwright/test";
import {
  ValidateMeterData,
  ValidateMeterDetails,
  ValidateMeterErrorResponse,
  ValidateMeterResponse,
  ValidateMeterScenario,
} from "../Mapper/validatemeter.mapper";

const INVALID_REASONS = [
  "METER_ALREADY_ASSIGNED",
  "METER_INACTIVE",
  "METER_NOT_FOUND",
  "ORGANISATION_MISMATCH",
  "OUT_OF_SCOPE",
] as const;

const REASON_FORMAT = /^[A-Z][A-Z0-9_]*$/;

export class ValidateMeterValidator {
  validateResponse(response: ValidateMeterResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateRootStructure(data: ValidateMeterData): void {
    expect(data).toHaveProperty("valid");
    expect(typeof data.valid).toBe("boolean");
  }

  validateMeterExistsType(data: ValidateMeterData): void {
    if (data.meterExists == null) {
      return;
    }
    expect(typeof data.meterExists).toBe("boolean");
  }

  validateReasonType(data: ValidateMeterData): void {
    if (data.reason == null) {
      return;
    }
    expect(typeof data.reason).toBe("string");
    expect(REASON_FORMAT.test(data.reason)).toBeTruthy();
    expect(INVALID_REASONS).toContain(data.reason);
  }

  validateValidReasonConsistency(data: ValidateMeterData): void {
    if (data.valid) {
      expect(data.reason == null || data.reason === undefined).toBeTruthy();
      return;
    }
    expect(data.reason).toBeTruthy();
  }

  validateInvalidScenario(data: ValidateMeterData): void {
    if (data.valid) {
      return;
    }
    expect(data.reason).toBeTruthy();
    expect(data.reason!.trim().length).toBeGreaterThan(0);
    expect(INVALID_REASONS).toContain(data.reason);
    expect(data.meterExists).not.toBe(false);
  }

  validateSerialEcho(
    data: ValidateMeterData,
    requestedSerial: string,
  ): void {
    expect(data.meterSerialNumber?.trim()).toBe(requestedSerial.trim());
  }

  validateMeterNotInSystem(response: ValidateMeterResponse): void {
    expect(response.data.valid).toBe(true);
    expect(response.data.meterExists).toBe(false);
    expect(response.data.reason).toBeUndefined();
    expect(response.data.meterLookupId).toBeUndefined();
    expect(response.data.organisationLookupId).toBeUndefined();
    expect(response.data.networkLookupId).toBeUndefined();
  }

  validateAssignableMeter(response: ValidateMeterResponse): void {
    const data = response.data;
    expect(data.valid).toBe(true);
    expect(data.meterExists).toBe(true);
    expect(data.meterLookupId).toBeGreaterThan(0);
    expect(data.meterSerialNumber?.trim().length).toBeGreaterThan(0);
    expect(data.organisationLookupId).toBeGreaterThan(0);
    expect(data.networkLookupId).toBeGreaterThan(0);
    if (data.phase != null) {
      expect(data.phase.trim().length).toBeGreaterThan(0);
    }
    this.validateMeterDetails(data.meterDetails);
  }

  validateMeterAlreadyAssigned(response: ValidateMeterResponse): void {
    expect(response.data.valid).toBe(false);
    expect(response.data.reason).toBe("METER_ALREADY_ASSIGNED");
    expect(response.data.meterLookupId).toBeGreaterThan(0);
    expect(response.data.meterSerialNumber?.trim().length).toBeGreaterThan(0);
    expect(response.data.organisationLookupId).toBeGreaterThan(0);
    expect(response.data.networkLookupId).toBeGreaterThan(0);
    this.validateMeterDetails(response.data.meterDetails);
  }

  validateMeterInactive(response: ValidateMeterResponse): void {
    expect(response.data.valid).toBe(false);
    expect(response.data.reason).toBe("METER_INACTIVE");
    expect(response.data.meterLookupId).toBeGreaterThan(0);
    expect(response.data.meterSerialNumber?.trim().length).toBeGreaterThan(0);
    this.validateMeterDetails(response.data.meterDetails);
  }

  validateMeterDetails(details?: ValidateMeterDetails): void {
    if (!details) {
      return;
    }

    if (details.meterPhaseTblRefId != null) {
      expect(details.meterPhaseTblRefId).toBeGreaterThan(0);
    }
    if (details.meterInitialReading != null) {
      expect(Number(details.meterInitialReading)).toBeGreaterThanOrEqual(0);
    }
    if (details.mainSubMeterTblRefId != null) {
      expect(details.mainSubMeterTblRefId).toBeGreaterThan(0);
    }
    if (details.servicePointId != null && details.servicePointId !== "") {
      expect(String(details.servicePointId).trim().length).toBeGreaterThan(0);
    }
  }

  validateValidationError(
    responseBody: ValidateMeterErrorResponse,
    field = "meterSerialNumber",
  ): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toContain(
      field.toLowerCase(),
    );
    const fieldErrors = responseBody.error.details?.fieldErrors?.[field];
    expect(Array.isArray(fieldErrors) && fieldErrors.length > 0).toBeTruthy();
  }

  validateScenario(
    response: ValidateMeterResponse,
    scenario: ValidateMeterScenario,
    requestedSerial: string,
  ): void {
    this.validateSerialEcho(response.data, requestedSerial);

    switch (scenario) {
      case "assignable":
        this.validateAssignableMeter(response);
        break;
      case "meter_not_in_system":
        this.validateMeterNotInSystem(response);
        break;
      case "already_assigned":
        this.validateMeterAlreadyAssigned(response);
        break;
      case "inactive":
        this.validateMeterInactive(response);
        break;
      default:
        break;
    }
  }
}
