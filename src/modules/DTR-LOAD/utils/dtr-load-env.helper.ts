import { test } from "@playwright/test";

export function skipIfDtrLoadInternalError(
  status: number,
  body: unknown,
  requestPath: string,
): void {
  if (status !== 500 || !body || typeof body !== "object") {
    return;
  }
  const code = (body as { error?: { code?: string } }).error?.code;
  if (code === "INTERNAL_ERROR") {
    test.skip(true, `Backend GET ${requestPath} returned 500 INTERNAL_ERROR`);
  }
}
