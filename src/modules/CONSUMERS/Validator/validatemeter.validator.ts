import { expect } from "@playwright/test";
import { ValidateMeterData } from "../Mapper/validatemeter.mapper";

const DATA_REQUIRED_FIELDS = ["valid", "reason"] as const;

const ALLOWED_REASONS = [
    "METER_NOT_FOUND",
    "METER_ALREADY_ASSIGNED",
    "METER_INACTIVE",
    "ORGANISATION_MISMATCH",
    "OUT_OF_SCOPE",
] as const;

const REASON_FORMAT = /^[A-Z][A-Z0-9_]*$/;

export class ValidateMeterValidator {
    validateSuccess(success: boolean) {
        expect(success).toBeTruthy();
    }

    validateRootStructure(data: ValidateMeterData) {
        expect(data).toHaveProperty("valid");
        expect(data).toHaveProperty("reason");
    }

    validateDataRequiredFields(data: ValidateMeterData) {
        DATA_REQUIRED_FIELDS.forEach((field) => {
            expect(data).toHaveProperty(field);
        });
    }

    validateValidFlagType(data: ValidateMeterData) {
        expect(typeof data.valid).toBe("boolean");
    }

    validateReasonType(data: ValidateMeterData) {
        expect(
            data.reason === null || typeof data.reason === "string",
        ).toBeTruthy();
    }

    validateInvalidScenario(data: ValidateMeterData) {
        if (data.valid) {
            return;
        }
        expect(data.reason).toBeTruthy();
        expect(data.reason!.trim().length).toBeGreaterThan(0);
        expect(REASON_FORMAT.test(data.reason!)).toBeTruthy();
        expect(ALLOWED_REASONS).toContain(data.reason);
    }

    validateValidScenario(data: ValidateMeterData) {
        if (!data.valid) {
            return;
        }
        expect(data.reason).toBeNull();
    }

    validateReasonAllowedValues(data: ValidateMeterData) {
        if (data.reason == null) {
            return;
        }
        expect(ALLOWED_REASONS).toContain(data.reason);
    }

    validateValidReasonConsistency(data: ValidateMeterData) {
        if (data.valid) {
            expect(data.reason).toBeNull();
            return;
        }
        expect(data.reason).not.toBeNull();
    }

    validateMeterDetailsWhenValid(
        data: ValidateMeterData,
        meterSerialNumber: string,
        organisationLookupId: number,
    ) {
        if (!data.valid) {
            return;
        }
        expect(data.meterLookupId).toBeGreaterThan(0);
        expect(Number.isFinite(data.meterLookupId)).toBeTruthy();
        expect(data.meterSerialNumber?.trim()).toBe(meterSerialNumber.trim());
        expect(data.organisationLookupId).toBe(organisationLookupId);
        expect(data.networkLookupId).toBeGreaterThan(0);
        if (data.phase != null) {
            expect(data.phase.trim().length).toBeGreaterThan(0);
        }
    }

    /** Invalid responses vary by reason — NOT_FOUND has no lookup fields; ASSIGNED returns meter context. */
    validateMeterDetailsByInvalidReason(
        data: ValidateMeterData,
        meterSerialNumber: string,
        organisationLookupId: number,
    ) {
        if (data.valid) {
            return;
        }

        if (data.reason === "METER_NOT_FOUND") {
            expect(data.meterLookupId).toBeUndefined();
            expect(data.meterSerialNumber).toBeUndefined();
            expect(data.networkLookupId).toBeUndefined();
            return;
        }

        if (data.reason === "METER_ALREADY_ASSIGNED") {
            expect(data.meterLookupId).toBeGreaterThan(0);
            expect(data.meterSerialNumber?.trim()).toBe(meterSerialNumber.trim());
            expect(data.organisationLookupId).toBe(organisationLookupId);
            expect(data.networkLookupId).toBeGreaterThan(0);
        }
    }

    validateExpectedOutcome(
        data: ValidateMeterData,
        expectedValid: boolean,
        expectedReason?: string,
    ) {
        expect(data.valid).toBe(expectedValid);
        if (expectedReason) {
            expect(data.reason).toBe(expectedReason);
        }
    }

    validateBusinessRules(data: ValidateMeterData) {
        if (!data.valid && data.reason === "METER_ALREADY_ASSIGNED") {
            expect(data.valid).toBeFalsy();
        }
        if (!data.valid && data.reason === "METER_NOT_FOUND") {
            expect(data.valid).toBeFalsy();
        }
        if (!data.valid && data.reason === "METER_INACTIVE") {
            expect(data.valid).toBeFalsy();
        }
    }

    validateDataPresentBackendRules(
        data: ValidateMeterData,
        meterSerialNumber: string,
        organisationLookupId: number,
        expectedValid?: boolean,
        expectedReason?: string,
    ) {
        this.validateRootStructure(data);
        this.validateDataRequiredFields(data);
        this.validateValidFlagType(data);
        this.validateReasonType(data);
        this.validateValidReasonConsistency(data);
        this.validateInvalidScenario(data);
        this.validateValidScenario(data);
        this.validateReasonAllowedValues(data);
        this.validateMeterDetailsWhenValid(
            data,
            meterSerialNumber,
            organisationLookupId,
        );
        this.validateMeterDetailsByInvalidReason(
            data,
            meterSerialNumber,
            organisationLookupId,
        );
        if (expectedValid !== undefined) {
            this.validateExpectedOutcome(
                data,
                expectedValid,
                expectedReason,
            );
        }
        this.validateBusinessRules(data);
    }
}
