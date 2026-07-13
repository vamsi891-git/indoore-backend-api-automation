/** True when API returned the generic consumption/backend crash envelope. */
export function isConsumptionInternalError(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }
  return (
    (body as { error?: { code?: string } }).error?.code === "INTERNAL_ERROR"
  );
}
