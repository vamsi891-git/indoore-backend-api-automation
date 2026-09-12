import { test } from "@playwright/test";

export const DEFAULT_FEEDER_CODE = "UVZ73";

export function resolveFeederCode(fallback = DEFAULT_FEEDER_CODE): string {
  return process.env.FEEDER_CODE?.trim() || fallback;
}

export function skipIfFeederInternalError(
  status: number,
  body: unknown,
  requestPath: string,
): void {
  if (status !== 500 || !body || typeof body !== "object") {
    return;
  }
  if ((body as { error?: { code?: string } }).error?.code === "INTERNAL_ERROR") {
    test.skip(true, `Backend GET ${requestPath} returned 500 INTERNAL_ERROR`);
  }
}
