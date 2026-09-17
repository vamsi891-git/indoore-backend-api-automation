import { expect } from "@playwright/test";
import type { ZodType } from "zod";
import { assertZodSchema } from "../../../core/utils/zod-validation.helper";

export class EnergyAuditsCommonValidator {
  static validateZodResponseSchema<T>(body: unknown, schema: ZodType<T>): T {
    return assertZodSchema(schema, body, "Zod Response Schema");
  }

  static validateErrorResponse(
    status: number,
    body: { success?: boolean; error?: { code?: string; message?: string } },
    expectedStatuses: number[],
    expectedCode?: string,
  ): void {
    expect(expectedStatuses).toContain(status);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
    if (expectedCode) {
      expect(body.error?.code).toBe(expectedCode);
    }
  }
}
