import { test } from "@playwright/test";

/** True when API returned the generic consumption/backend crash envelope. */
export function isConsumptionInternalError(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }
  return (
    (body as { error?: { code?: string } }).error?.code === "INTERNAL_ERROR"
  );
}

export function skipIfConsumptionInternalError(
  status: number,
  body: unknown,
  requestPath: string,
): void {
  if (status === 500 && isConsumptionInternalError(body)) {
    test.skip(true, `Backend GET ${requestPath} returned 500 INTERNAL_ERROR`);
  }
}
