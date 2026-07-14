import { expect } from "@playwright/test";
import {
  MeterValidationData,
} from "../Mapper/meter-validation.mapper";

const REQUIRED_FIELDS = [
  "valid",
  "message",
  "meterLookupId",
  "meterSerial",
] as const;

export class MeterValidationValidator {

  validateSuccess(success: boolean) {
    expect(success).toBeTruthy();
  }

  validateRootStructure(data: MeterValidationData) {
    expect(typeof data).toBe("object");
  }

  validateRequiredFields(data: MeterValidationData) {
    REQUIRED_FIELDS.forEach((field) => {
      expect(data).toHaveProperty(field);
    });
  }

  validateValidFlag(data: MeterValidationData) {
    expect(typeof data.valid).toBe("boolean");
  }

  validateMessage(data: MeterValidationData) {
    expect(typeof data.message).toBe("string");
    expect(data.message.trim().length).toBeGreaterThan(0);
  }

  validateMessageTrim(data: MeterValidationData) {
    expect(data.message).toBe(data.message.trim());
  }

  validateMeterLookupId(data: MeterValidationData) {
    expect(typeof data.meterLookupId).toBe("number");
    expect(Number.isInteger(data.meterLookupId)).toBeTruthy();
    expect(data.meterLookupId).toBeGreaterThan(0);
  }

  validateMeterSerial(data: MeterValidationData) {
    expect(typeof data.meterSerial).toBe("string");
    expect(data.meterSerial.trim().length).toBeGreaterThan(0);
  }

  validateMeterSerialTrim(data: MeterValidationData) {
    expect(data.meterSerial).toBe(
      data.meterSerial.trim(),
    );
  }

  validateMeterSerialLength(data: MeterValidationData) {
    expect(data.meterSerial.length).toBeGreaterThan(0);
    expect(data.meterSerial.length).toBeLessThanOrEqual(100);
  }

  validateNoNullValues(data: MeterValidationData) {
    Object.values(data).forEach((value) => {
      expect(value).not.toBeNull();
    });
  }

  validateNoUndefinedValues(data: MeterValidationData) {
    Object.values(data).forEach((value) => {
      expect(value).not.toBeUndefined();
    });
  }

  validateLookupIdRange(data: MeterValidationData) {
    expect(data.meterLookupId).toBeLessThan(
      Number.MAX_SAFE_INTEGER,
    );
  }

  validateLookupIdPositive(data: MeterValidationData) {
    expect(data.meterLookupId).toBeGreaterThan(0);
  }

  validateMessageLength(data: MeterValidationData) {
    expect(data.message.length).toBeGreaterThan(0);
    expect(data.message.length).toBeLessThanOrEqual(500);
  }

  validateMessageCharacters(data: MeterValidationData) {
    expect(data.message).not.toContain("\n");
    expect(data.message).not.toContain("\r");
    expect(data.message).not.toContain("\t");
  }

  validateMeterSerialCharacters(data: MeterValidationData) {
    expect(data.meterSerial).not.toContain("\n");
    expect(data.meterSerial).not.toContain("\r");
    expect(data.meterSerial).not.toContain("\t");
  }

  validateStringFields(data: MeterValidationData) {
    expect(typeof data.message).toBe("string");
    expect(typeof data.meterSerial).toBe("string");
  }

  validateNumericFields(data: MeterValidationData) {
    expect(typeof data.meterLookupId).toBe("number");
  }

  validateBooleanField(data: MeterValidationData) {
    expect(typeof data.valid).toBe("boolean");
  }

  validateResponseIntegrity(data: MeterValidationData) {
    expect(data.message).toBeTruthy();
    expect(data.meterSerial).toBeTruthy();
    expect(data.meterLookupId).toBeTruthy();
  }

  validateMeterIdentity(data: MeterValidationData) {
    expect(data.meterLookupId).toBeGreaterThan(0);
    expect(data.meterSerial.length).toBeGreaterThan(0);
  }

  validateObjectSize(data: MeterValidationData & { success?: boolean }) {
    expect(
      Object.keys(data).length,
    ).toBe(5);
  }

  validateNoExtraFields(data: MeterValidationData & { success?: boolean }) {
    expect(
      Object.keys(data).sort(),
    ).toEqual([
      "message",
      "meterLookupId",
      "meterSerial",
      "success",
      "valid",
    ]);
  }

  validateBusinessRules(data: MeterValidationData) {
    expect(data).toHaveProperty("valid");
    expect(data).toHaveProperty("message");
    expect(data).toHaveProperty("meterLookupId");
    expect(data).toHaveProperty("meterSerial");
  }
  validateValidMeterRule(
    data: MeterValidationData,
  ) {
    if (data.valid) {
      expect(data.meterLookupId).toBeGreaterThan(0);
      expect(data.meterSerial.length).toBeGreaterThan(0);
    }
  }

  validateInvalidMeterRule(
    data: MeterValidationData,
  ) {
    if (!data.valid) {
      expect(data.message.length).toBeGreaterThan(0);
    }
  }

  validateEligibleMeterMessage(
    data: MeterValidationData,
  ) {
    if (data.valid) {
      expect(
        data.message.toLowerCase(),
      ).toContain("eligible");
    }
  }

  validateIneligibleMeterMessage(
    data: MeterValidationData,
  ) {
    if (!data.valid) {
      expect(
        data.message.length,
      ).toBeGreaterThan(0);
    }
  }

  validateMeterLookupRelationship(
    data: MeterValidationData,
  ) {
    expect(data.meterLookupId).toBeGreaterThan(0);

    expect(
      data.meterSerial.trim().length,
    ).toBeGreaterThan(0);
  }

  validateMessageConsistency(
    data: MeterValidationData,
  ) {
    expect(data.message).toBe(
      data.message.trim(),
    );
  }

  validateSerialConsistency(
    data: MeterValidationData,
  ) {
    expect(data.meterSerial).toBe(
      data.meterSerial.trim(),
    );
  }

  validateMeterSerialNumeric(
    data: MeterValidationData,
  ) {
    expect(
      /^[A-Za-z0-9]+$/.test(
        data.meterSerial,
      ),
    ).toBeTruthy();
  }

  validateLookupIdConsistency(
    data: MeterValidationData,
  ) {
    expect(
      Number.isInteger(
        data.meterLookupId,
      ),
    ).toBeTruthy();
  }

  validateValidFlagConsistency(
    data: MeterValidationData,
  ) {
    if (data.valid) {
      expect(
        data.meterLookupId,
      ).toBeGreaterThan(0);
    }
  }

  validateMessageNotEmpty(
    data: MeterValidationData,
  ) {
    expect(
      data.message.trim().length,
    ).toBeGreaterThan(0);
  }

  validateMeterSerialNotEmpty(
    data: MeterValidationData,
  ) {
    expect(
      data.meterSerial.trim().length,
    ).toBeGreaterThan(0);
  }

  validateMeterLookupExists(
    data: MeterValidationData,
  ) {
    expect(
      data.meterLookupId,
    ).toBeGreaterThan(0);
  }

  validateNoWhitespaceSerial(
    data: MeterValidationData,
  ) {
    expect(
      data.meterSerial,
    ).not.toMatch(/^\s+$/);
  }

  validateNoWhitespaceMessage(
    data: MeterValidationData,
  ) {
    expect(
      data.message,
    ).not.toMatch(/^\s+$/);
  }

  validateMeterLookupSafeRange(
    data: MeterValidationData,
  ) {
    expect(
      data.meterLookupId,
    ).toBeLessThanOrEqual(
      Number.MAX_SAFE_INTEGER,
    );
  }

  validateSerialLength(
    data: MeterValidationData,
  ) {
    expect(
      data.meterSerial.length,
    ).toBeGreaterThan(0);

    expect(
      data.meterSerial.length,
    ).toBeLessThanOrEqual(100);
  }

  validateMessageSafeLength(
    data: MeterValidationData,
  ) {
    expect(
      data.message.length,
    ).toBeLessThanOrEqual(500);
  }

  validateResponseObjectIntegrity(
    data: MeterValidationData,
  ) {
    expect(data.valid).not.toBeNull();

    expect(data.message).not.toBeNull();

    expect(data.meterLookupId).not.toBeNull();

    expect(data.meterSerial).not.toBeNull();
  }

  validateResponseObjectDefined(
    data: MeterValidationData,
  ) {
    expect(data.valid).not.toBeUndefined();

    expect(data.message).not.toBeUndefined();

    expect(data.meterLookupId).not.toBeUndefined();

    expect(data.meterSerial).not.toBeUndefined();
  }

  validateMeterLookupNotZero(
    data: MeterValidationData,
  ) {
    expect(
      data.meterLookupId,
    ).not.toBe(0);
  }

  validateMeterSerialFormat(
    data: MeterValidationData,
  ) {
    expect(
      data.meterSerial.trim(),
    ).toEqual(
      data.meterSerial,
    );
  }

  validateBackendBusinessRule(
    data: MeterValidationData,
  ) {
    if (data.valid) {
      expect(
        data.message.toLowerCase(),
      ).toContain("valid");
    }
  }
}