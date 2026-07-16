import { expect } from "@playwright/test";
import type { CreateSubmissionData } from "../Mapper/create-submission.mapper";

export class CreateSubmissionValidator {
  validateSuccess(success: boolean) {
    expect(success).toBeTruthy();
  }

  validateRootStructure(data: CreateSubmissionData) {
    expect(typeof data).toBe("object");
    expect(data).not.toBeNull();
  }

  validateRequiredFields(data: CreateSubmissionData) {
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("status");
  }

  validateId(data: CreateSubmissionData) {
    expect(typeof data.id).toBe("number");
    expect(Number.isInteger(data.id)).toBeTruthy();
    expect(data.id).toBeGreaterThan(0);
  }

  validateStatus(
    data: CreateSubmissionData,
    expected: string | string[] = "PENDING",
  ) {
    expect(typeof data.status).toBe("string");
    expect(data.status.trim().length).toBeGreaterThan(0);
    const allowed = (Array.isArray(expected) ? expected : [expected]).map(
      (s) => s.toUpperCase(),
    );
    expect(allowed).toContain(data.status.toUpperCase());
  }

  validateStatusTrim(data: CreateSubmissionData) {
    expect(data.status).toBe(data.status.trim());
  }

  validateNoNullValues(data: CreateSubmissionData) {
    Object.values(data).forEach((value) => {
      expect(value).not.toBeNull();
    });
  }

  validateNoUndefinedValues(data: CreateSubmissionData) {
    Object.values(data).forEach((value) => {
      expect(value).not.toBeUndefined();
    });
  }

  validateObjectSize(data: CreateSubmissionData & { success?: boolean }) {
    expect(Object.keys(data).length).toBe(3);
  }

  validateNoExtraFields(data: CreateSubmissionData & { success?: boolean }) {
    expect(Object.keys(data).sort()).toEqual(["id", "status", "success"]);
  }

  /** Create may return PENDING or auto-COMPLETED depending on backend flow. */
  validateCreatedBusinessRule(data: CreateSubmissionData) {
    expect(data.id).toBeGreaterThan(0);
    expect(["PENDING", "COMPLETED"]).toContain(data.status.toUpperCase());
  }

  validatePendingBusinessRule(data: CreateSubmissionData) {
    this.validateCreatedBusinessRule(data);
  }
}
