import type { APIRequestContext } from "@playwright/test";
import { DtrMasterApi } from "../Api/dtr-master.api";
import { setCreateDtrExistsCode } from "../Data/create-dtr.data";
import { resolveMasterDataEnv } from "./master-data-env.helper";

/**
 * Resolves a DTR code that already exists in the target environment for duplicate-code tests.
 * CI may not have the default RJ662 — we discover a real code from DTR master when needed.
 */
export async function ensureCreateDtrExistsCode(
  authenticatedApi: APIRequestContext,
): Promise<string | null> {
  const fromEnv = resolveMasterDataEnv("CREATE_DTR_EXISTS_CODE");
  if (fromEnv) {
    setCreateDtrExistsCode(fromEnv);
    return fromEnv;
  }

  try {
    const api = new DtrMasterApi(authenticatedApi);
    const { responseBody } = await api.getDtrMasterData({ page: 1, limit: 25 });
    const rows =
      responseBody.data?.rows ??
      responseBody.data?.items ??
      [];
    for (const row of rows) {
      const code = String(
        (row as { dtr?: string; dtrCode?: string })?.dtr ??
          (row as { dtrCode?: string })?.dtrCode ??
          "",
      ).trim();
      if (code) {
        setCreateDtrExistsCode(code);
        console.log(`[create-dtr] resolved existing DTR code for duplicate test: ${code}`);
        return code;
      }
    }
  } catch (error) {
    console.warn(
      `[create-dtr] could not resolve existing DTR code from master list: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return null;
}
