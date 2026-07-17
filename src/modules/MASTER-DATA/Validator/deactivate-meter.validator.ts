import { expect } from "@playwright/test";
import {
  deactivateMeterAlreadyInactiveMessage,
  deactivateMeterSuccessMessage,
} from "../Data/deactivate-meter.data";
import {
  DEACTIVATE_METER_SUCCESS_FIELDS,
  DeactivateMeterMapped,
  DeactivateMeterResponseData,
  DeactivateMeterScenario,
} from "../Mapper/deactivate-meter.mapper";

const KNOWN_ERROR_CODES = ["METER_NOT_FOUND", "VALIDATION_ERROR", "NOT_FOUND"] as const;

export class DeactivateMeterValidator {
  validateResponse(mapped: DeactivateMeterMapped): void {
    expect(mapped).toBeDefined();
  }

  validateDeactivateSuccess(mapped: DeactivateMeterMapped): void {
    expect(mapped.isDeactivateSuccess).toBeTruthy();
    expect(mapped.data).not.toBeNull();
  }

  validateRequiredResponseFields(data: DeactivateMeterResponseData): void {
    DEACTIVATE_METER_SUCCESS_FIELDS.forEach((field) => {
      expect(data).toHaveProperty(field);
    });
  }

  validatePositiveIds(data: DeactivateMeterResponseData): void {
    expect(data.meterLookupTblRefId).toBeGreaterThan(0);
    expect(data.meterTblRefId).toBeGreaterThan(0);
  }

  validateSerial(data: DeactivateMeterResponseData): void {
    expect(typeof data.meterSerialNumber).toBe("string");
    expect(data.meterSerialNumber.trim().length).toBeGreaterThan(0);
  }

  validateInactiveFlags(data: DeactivateMeterResponseData): void {
    expect(data.isActiveStatus).toBe(false);
    expect(typeof data.previousIsActiveStatus).toBe("boolean");
  }

  validateLookupIdEcho(
    data: DeactivateMeterResponseData,
    meterLookupTblRefId: number,
  ): void {
    expect(data.meterLookupTblRefId).toBe(meterLookupTblRefId);
  }

  validateFirstDeactivate(
    mapped: DeactivateMeterMapped,
    meterLookupTblRefId: number,
  ): void {
    this.validateDeactivateSuccess(mapped);
    expect(mapped.message).toBe(deactivateMeterSuccessMessage);
    const data = mapped.data!;
    this.validateRequiredResponseFields(data);
    this.validatePositiveIds(data);
    this.validateSerial(data);
    this.validateInactiveFlags(data);
    expect(data.previousIsActiveStatus).toBe(true);
    this.validateLookupIdEcho(data, meterLookupTblRefId);
  }

  validateAlreadyInactive(
    mapped: DeactivateMeterMapped,
    meterLookupTblRefId: number,
  ): void {
    this.validateDeactivateSuccess(mapped);
    expect(mapped.message).toBe(deactivateMeterAlreadyInactiveMessage);
    const data = mapped.data!;
    this.validateRequiredResponseFields(data);
    this.validatePositiveIds(data);
    this.validateSerial(data);
    this.validateInactiveFlags(data);
    expect(data.previousIsActiveStatus).toBe(false);
    this.validateLookupIdEcho(data, meterLookupTblRefId);
  }

  validateErrorStructure(mapped: DeactivateMeterMapped): void {
    expect(mapped.success).toBeFalsy();
    expect(mapped.error).not.toBeNull();
    expect(mapped.error!.code).toBeTruthy();
    expect(mapped.error!.message).toBeTruthy();
  }

  validateNotFound(mapped: DeactivateMeterMapped): void {
    this.validateErrorStructure(mapped);
    expect(KNOWN_ERROR_CODES).toContain(mapped.error!.code);
    expect(mapped.error!.code).toBe("METER_NOT_FOUND");
    expect(mapped.error!.message.toLowerCase()).toMatch(
      /not found|not in your scope/,
    );
  }

  validateScenario(
    mapped: DeactivateMeterMapped,
    scenario: DeactivateMeterScenario,
    meterLookupTblRefId: number,
  ): void {
    switch (scenario) {
      case "success":
        this.validateFirstDeactivate(mapped, meterLookupTblRefId);
        break;
      case "already_inactive":
        this.validateAlreadyInactive(mapped, meterLookupTblRefId);
        break;
      case "not_found":
        this.validateNotFound(mapped);
        break;
    }
  }
}
