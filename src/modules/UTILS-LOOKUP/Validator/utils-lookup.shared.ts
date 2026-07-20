import { expect } from "@playwright/test";
export interface UtilsLookupErrorBody {
  success: boolean;
  error?: { code?: string; message?: string };
}
export class UtilsLookupSharedValidator {
  validateValidationError(responseBody: UtilsLookupErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }
  validateApiError(responseBody: UtilsLookupErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBeTruthy();
    expect(responseBody.error?.message).toBeTruthy();
  }
  validateSuccessEnvelope(responseBody: { success?: boolean; data?: unknown }): void {
    expect(responseBody.success).toBeTruthy();
    expect(responseBody.data).toBeDefined();
  }
}
