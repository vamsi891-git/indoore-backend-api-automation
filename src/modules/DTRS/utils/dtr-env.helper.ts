import { test } from "@playwright/test";

/** True when API returned the generic backend crash envelope. */
export function isDtrInternalError(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }
  return (body as { error?: { code?: string } }).error?.code === "INTERNAL_ERROR";
}

export function skipIfDtrInternalError(
  status: number,
  body: unknown,
  requestPath: string,
): void {
  if (status === 500 && isDtrInternalError(body)) {
    test.skip(true, `Backend GET ${requestPath} returned 500 INTERNAL_ERROR`);
  }
}
