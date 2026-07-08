import { expect, type APIResponse } from "@playwright/test";

/**
 * Negative master-data tests PASS when the API rejects invalid input (4xx).
 * They FAIL when the API accepts invalid input (HTTP 201 Created).
 */
export function assertNegativeMasterDataHttpStatus(
  rawResponse: APIResponse,
  expectedStatus: number,
): void {
  const status = rawResponse.status();
  expect(
    status,
    "Invalid payload must not return HTTP 201 — backend accepted data that should be rejected",
  ).not.toBe(201);
  expect(status).toBe(expectedStatus);
}

export function assertMustNotCreateRecord(success: boolean, data: unknown): void {
  expect(
    success && data != null,
    "success=true with data means record was created — negative test must fail",
  ).toBe(false);
}
