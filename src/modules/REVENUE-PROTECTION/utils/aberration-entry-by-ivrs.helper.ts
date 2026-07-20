import type { APIRequestContext } from "@playwright/test";
import { AberrationEntryApi } from "../Api/aberration-entry.api";
import { resolveAberrationEntryKnownIvrs } from "../Data/aberration-entry-by-ivrs.data";
import { AberrationEntryMapper } from "../Mapper/aberration-entry.mapper";

/**
 * Resolve an editable IVRS for PATCH tests: env override, else first
 * non-empty IVRS from zone aberration-entry list.
 */
export async function resolveAberrationEntryIvrsForUpdate(
  authenticatedApi: APIRequestContext,
): Promise<string> {
  const fromEnv = resolveAberrationEntryKnownIvrs();
  if (fromEnv) return fromEnv;

  const api = new AberrationEntryApi(authenticatedApi);
  const { responseBody } = await api.getAberrationEntry({
    entryType: "zone",
    page: 1,
    limit: 10,
  });
  const mapped = AberrationEntryMapper.mapData(responseBody.data);
  const ivrs = mapped.rows.map((r) => r.ivrsNo.trim()).find((v) => v.length > 0);
  if (!ivrs) {
    throw new Error(
      "No IVRS available for aberration-entry PATCH tests. Set RP_ABERRATION_ENTRY_IVRS.",
    );
  }
  return ivrs;
}
