import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import { logDbVsApiSection } from "../../../core/db/db-compare.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { DtrFeedersApi } from "../Api/dtrfeeders.api";
import { DtrProfileApi } from "../Api/dtrprofile.api";
import { dtrProfileDefaultCode } from "../Data/dtrprofile.data";
import { DtrFeedersMapper } from "../Mapper/dtrfeeders.mapper";
import { DtrProfileMapper } from "../Mapper/dtrprofile.mapper";
import {
  compareDtrProfileSpotToDb,
  compareDtrsCountLteDb,
} from "../Db/dtrs-db-compare";
import {
  countActiveDtrs,
  countDtrFeederAncestors,
  getDtrBaseByCode,
} from "../Db/dtrs.db";
import { logDtrsDataQualityFindings } from "../Db/dtrs-db.validator";

function profileValue(
  items: Array<{ title: string; value: string | null }>,
  title: string,
): string | null {
  const hit = items.find((item) => item.title === title);
  const value = hit?.value?.trim() ?? "";
  return value.length > 0 ? value : null;
}

/**
 * Part 4 harness — aligned with DtrRepository.getDtrBaseByCode / getDtrFeedersByCode.
 *
 * Statistics / power-triangle / daily-threshold / capacity-gauge / events are
 * archive or activity aggregates — intentionally not DB-checked here (no stable
 * single-row header equivalent beyond the profile base).
 */
export async function runDtrsDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ValidationEngine();
  const dtrCode = dtrProfileDefaultCode;
  const profileApi = new DtrProfileApi(authenticatedApi);
  const feedersApi = new DtrFeedersApi(authenticatedApi);

  const profileResult = await profileApi.getProfile(dtrCode);
  expect(profileResult.rawResponse.status()).toBe(200);
  const mappedProfile = DtrProfileMapper.map(profileResult.responseBody);
  expect(mappedProfile.success).toBe(true);
  await logDtrsDataQualityFindings(
    "profile",
    profileResult.responseBody.data as unknown as Record<string, unknown>,
  );

  const dbBase = await getDtrBaseByCode(db, dtrCode);
  validation.execute(`DTR profile vs getDtrBaseByCode (${dtrCode})`, () => {
    expect(dbBase, `DB DTR base missing for code=${dtrCode}`).toBeTruthy();
    compareDtrProfileSpotToDb({
      api: {
        dtrNo: profileValue(mappedProfile.profileInformation, "DTR No"),
        dtrName: profileValue(mappedProfile.profileInformation, "DTR Name"),
        circle: profileValue(mappedProfile.profileInformation, "Circle"),
        division: profileValue(mappedProfile.profileInformation, "Division"),
        zone: profileValue(mappedProfile.profileInformation, "Zone"),
        subStation: profileValue(
          mappedProfile.profileInformation,
          "Sub Station",
        ),
        feeder: profileValue(mappedProfile.profileInformation, "Feeder"),
        meterSerial: profileValue(
          mappedProfile.profileInformation,
          "Meter SL No",
        ),
        mf: profileValue(mappedProfile.profileInformation, "MF"),
      },
      dbRow: dbBase!,
    });
  });

  const activeDtrCount = await countActiveDtrs(db);
  validation.execute("Active DTR master universe is non-empty", () => {
    expect(activeDtrCount).toBeGreaterThan(0);
  });

  const feedersResult = await feedersApi.getFeeders(dtrCode);
  expect(feedersResult.rawResponse.status()).toBe(200);
  const mappedFeeders = DtrFeedersMapper.map(feedersResult.responseBody);
  expect(mappedFeeders.success).toBe(true);

  expect(dbBase, "DB base required for feeder ancestor count").toBeTruthy();
  const dbFeederCount = await countDtrFeederAncestors(
    db,
    dbBase!.networkLookupId,
  );
  logDbVsApiSection(
    "DTR feeders",
    {
      total: mappedFeeders.feeders.length,
      page: 1,
      limit: mappedFeeders.feeders.length || 1,
      rowCount: mappedFeeders.feeders.length,
    },
    { total: dbFeederCount },
    { totalMode: "exact" },
  );
  validation.execute("DTR feeders count matches feeder-ancestor SQL", () => {
    expect(mappedFeeders.feeders.length).toBe(dbFeederCount);
    compareDtrsCountLteDb({
      label: "dtrs.feeders.count",
      apiCount: mappedFeeders.feeders.length,
      dbCount: dbFeederCount,
    });
  });

  validation.printSummary("DTRS DB Coverage", 0);
}
