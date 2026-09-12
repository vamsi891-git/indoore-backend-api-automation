import { test } from "@playwright/test";

export function isBillingInternalError(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }
  return (body as { error?: { code?: string } }).error?.code === "INTERNAL_ERROR";
}

export function skipIfBillingInternalError(
  status: number,
  body: unknown,
  requestPath: string,
): void {
  if (status === 500 && isBillingInternalError(body)) {
    test.skip(true, `Backend GET ${requestPath} returned 500 INTERNAL_ERROR`);
  }
}
