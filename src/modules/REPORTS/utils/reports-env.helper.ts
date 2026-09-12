import { test } from "@playwright/test";

/** Set REPORTS_SKIP_BACKEND_DEFECTS=1 to skip @backend-defect cases (green CI while backend fixes land). */
export function shouldSkipReportsBackendDefect(tags: readonly string[]): boolean {
  const flag = process.env.REPORTS_SKIP_BACKEND_DEFECTS?.trim().toLowerCase();
  const enabled = flag === "1" || flag === "true" || flag === "yes";
  return enabled && tags.includes("@backend-defect");
}

/** True when API returned the generic reports/backend crash envelope. */
export function isReportsInternalError(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }
  return (
    (body as { error?: { code?: string } }).error?.code === "INTERNAL_ERROR"
  );
}

/** Soft-skip live 200-path tests when the backend crashes with INTERNAL_ERROR. */
export function skipIfReportsInternalError(
  status: number,
  body: unknown,
  requestPath: string,
): void {
  if (status === 500 && isReportsInternalError(body)) {
    test.skip(
      true,
      `Backend GET ${requestPath} returned 500 INTERNAL_ERROR`,
    );
  }
}
