import { expect } from "@playwright/test";
import { VALIDATE_ADD_METER_ALREADY_EXISTS_MESSAGE } from "../Data/validate-add-meter.data";
import {
  ValidateAddMeterData,
  ValidateAddMeterResponse,
  ValidateAddMeterScenario,
} from "../Mapper/validate-add-meter.mapper";

const ALLOWED_REASONS = ["METER_ALREADY_EXISTS"] as const;

const REASON_FORMAT = /^[A-Z][A-Z0-9_]*$/;

export class ValidateAddMeterValidator {
  validateResponse(response: ValidateAddMeterResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateRootStructure(data: ValidateAddMeterData): void {
    expect(data).toHaveProperty("valid");
    expect(typeof data.valid).toBe("boolean");
  }

  validateReasonType(data: ValidateAddMeterData): void {
    if (data.reason == null) {
      return;
    }
    expect(typeof data.reason).toBe("string");
    expect(REASON_FORMAT.test(data.reason)).toBeTruthy();
    expect(ALLOWED_REASONS).toContain(data.reason);
  }

  validateMessageType(data: ValidateAddMeterData): void {
    if (data.message == null) {
      return;
    }
    expect(typeof data.message).toBe("string");
    expect(data.message.trim().length).toBeGreaterThan(0);
  }

  validateValidNewMeter(response: ValidateAddMeterResponse): void {
    expect(response.data.valid).toBe(true);
    expect(response.data.reason).toBeUndefined();
    expect(response.data.message).toBeUndefined();
  }

  validateMeterAlreadyExists(response: ValidateAddMeterResponse): void {
    expect(response.data.valid).toBe(false);
    expect(response.data.reason).toBe("METER_ALREADY_EXISTS");
    expect(response.data.message).toBe(VALIDATE_ADD_METER_ALREADY_EXISTS_MESSAGE);
  }

  validateValidReasonConsistency(data: ValidateAddMeterData): void {
    if (data.valid) {
      expect(data.reason).toBeUndefined();
      expect(data.message).toBeUndefined();
      return;
    }
    expect(data.reason).toBeTruthy();
    expect(data.message?.trim().length).toBeGreaterThan(0);
  }

  validateScenario(
    response: ValidateAddMeterResponse,
    scenario: ValidateAddMeterScenario,
  ): void {
    switch (scenario) {
      case "valid_new":
        this.validateValidNewMeter(response);
        break;
      case "already_exists":
        this.validateMeterAlreadyExists(response);
        break;
    }
  }

  validateValidationError(
    status: number,
    body: {
      success?: boolean;
      error?: { code?: string; message?: string };
    },
  ): void {
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe("VALIDATION_ERROR");
    expect(body.error?.message?.toLowerCase()).toContain("meterserialnumber");
  }
}
