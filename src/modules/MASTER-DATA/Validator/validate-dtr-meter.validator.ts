import { expect } from "@playwright/test";
import {
  ValidateDtrMeterData,
  ValidateDtrMeterResponse,
  ValidateDtrMeterScenario,
} from "../Mapper/validate-dtr-meter.mapper";

const ALLOWED_REASONS = [
  "METER_ALREADY_ON_DTR",
  "METER_INACTIVE",
  "METER_ALREADY_ASSIGNED",
] as const;

const REASON_FORMAT = /^[A-Z][A-Z0-9_]*$/;

export class ValidateDtrMeterValidator {
  validateResponse(response: ValidateDtrMeterResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateRootStructure(data: ValidateDtrMeterData): void {
    expect(data).toHaveProperty("valid");
    expect(typeof data.valid).toBe("boolean");
  }

  validateReasonType(data: ValidateDtrMeterData): void {
    if (data.reason == null) {
      return;
    }
    expect(typeof data.reason).toBe("string");
    expect(REASON_FORMAT.test(data.reason)).toBeTruthy();
    expect(ALLOWED_REASONS).toContain(data.reason);
  }

  validateMeterExistsType(data: ValidateDtrMeterData): void {
    if (data.meterExists == null) {
      return;
    }
    expect(typeof data.meterExists).toBe("boolean");
  }

  validateInvalidScenario(data: ValidateDtrMeterData): void {
    if (data.valid) {
      return;
    }
    expect(data.reason).toBeTruthy();
    expect(data.reason!.trim().length).toBeGreaterThan(0);
    expect(ALLOWED_REASONS).toContain(data.reason);
    expect(data.meterExists).not.toBe(false);
  }

  validateMeterAlreadyOnDtr(response: ValidateDtrMeterResponse): void {
    expect(response.data.valid).toBe(false);
    expect(response.data.reason).toBe("METER_ALREADY_ON_DTR");
  }

  validateMeterInactive(response: ValidateDtrMeterResponse): void {
    expect(response.data.valid).toBe(false);
    expect(response.data.reason).toBe("METER_INACTIVE");
  }

  validateMeterAlreadyAssigned(response: ValidateDtrMeterResponse): void {
    expect(response.data.valid).toBe(false);
    expect(response.data.reason).toBe("METER_ALREADY_ASSIGNED");
  }

  validateValidMeter(response: ValidateDtrMeterResponse): void {
    expect(response.data.valid).toBe(true);
    expect(response.data.meterExists).toBe(true);
    expect(response.data.meterLookupId).toBeGreaterThan(0);
    expect(response.data.meterSerialNumber?.trim().length).toBeGreaterThan(0);
    expect(response.data.organisationLookupId).toBeGreaterThan(0);
    expect(response.data.networkLookupId).toBeGreaterThan(0);
    if (response.data.phase != null) {
      expect(response.data.phase.trim().length).toBeGreaterThan(0);
    }
  }

  validateMeterNotFound(response: ValidateDtrMeterResponse): void {
    expect(response.data.valid).toBe(true);
    expect(response.data.meterExists).toBe(false);
    expect(response.data.reason).toBeUndefined();
  }

  validateMeterDetails(response: ValidateDtrMeterResponse): void {
    const details = response.data.meterDetais;
    if (!details) {
      return;
    }

    if (details.meterPhaseTblRefId != null) {
      expect(details.meterPhaseTblRefId).toBeGreaterThan(0);
    }
    if (details.meterInitialReading != null) {
      expect(Number(details.meterInitialReading)).toBeGreaterThanOrEqual(0);
    }
    if (details.meterInitialReadingDate != null) {
      expect(details.meterInitialReadingDate).toBeDefined();
    }
    if (details.meterInitialReadingTime != null) {
      expect(details.meterInitialReadingTime).toBeDefined();
    }
    if (details.servicePointId != null) {
      expect(details.servicePointId).toBeGreaterThan(0);
    }
    if (details.mainSubMeterTblRefId != null) {
      expect(details.mainSubMeterTblRefId).toBeGreaterThan(0);
    }
  }

  validateScenario(
    response: ValidateDtrMeterResponse,
    scenario: ValidateDtrMeterScenario,
  ): void {
    switch (scenario) {
      case "valid_unmapped":
        this.validateValidMeter(response);
        this.validateMeterDetails(response);
        break;
      case "already_on_dtrs":
        this.validateMeterAlreadyOnDtr(response);
        break;
      case "inactive":
        this.validateMeterInactive(response);
        break;
      case "already_assigned":
        this.validateMeterAlreadyAssigned(response);
        break;
      case "not_found":
        this.validateMeterNotFound(response);
        break;
    }
  }
}
