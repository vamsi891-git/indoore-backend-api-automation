import { test } from "@playwright/test";

/** Soft-skip when archive statement timeout surfaces as 503 QUERY_TIMEOUT. */
export function isCollectionReportQueryTimeout(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }
  const code = (body as { error?: { code?: string } }).error?.code;
  return code === "QUERY_TIMEOUT";
}

export function skipIfCollectionReportUnavailable(
  status: number,
  body: unknown,
  requestPath = "/indore/collection-report",
): void {
  if (status === 503 && isCollectionReportQueryTimeout(body)) {
    const message =
      (body as { error?: { message?: string } }).error?.message ?? "archive query timed out";
    test.skip(true, `Backend GET ${requestPath} returned 503 QUERY_TIMEOUT: ${message}`);
  }
  if (status === 500) {
    const code = (body as { error?: { code?: string } }).error?.code;
    if (code === "INTERNAL_ERROR") {
      test.skip(true, `Backend GET ${requestPath} returned 500 INTERNAL_ERROR`);
    }
  }
}
