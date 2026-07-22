import { expect } from "@playwright/test";
import { test } from "../../../fixtures/observability.fixture";
import { compareApiToDb } from "../../../core/db/db-compare.engine";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { AtrZoneApi } from "../Api/atr-zone.api";
import { atrZoneDefaultQuery } from "../Data/atr-zone.data";
import { AtrZoneMapper } from "../Mapper/atr-zone.mapper";
import {countAtrZoneForFilters,getAtrZoneRowByBusinessKey,isAtrZoneDbSqlReady,resolveDbSampleSize,sampleRowIds,} from "../Db/atr-zone.db";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
test.describe("Revenue Protection — ATR Zone DB cross-validation", () => {
  test.describe.configure({ retries: 1, mode: "serial" });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);
  test.beforeEach(() => {
    test.skip(!isDbConfigured(), "DB credentials not configured");
    test.skip(
      !isAtrZoneDbSqlReady(),
      "Set RP_ATRZONE_DB_SQL_READY=true after confirming atr-zone SQL against live schema",
    );
  });
  test("IND-RPT-ATZ-DB-001 — COUNT(*) matches pagination.total",
    { tag: ["@revenue-protection", "@atr-zone", "@db"] },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId("IND-RPT-ATZ-DB-001");
      const api = new AtrZoneApi(authenticatedApi);
      const { responseBody } = await api.getAtrZone({ ...atrZoneDefaultQuery, page: 1, limit: 100 });
      const mapped = AtrZoneMapper.mapData(responseBody.data);
      const dbCount = await countAtrZoneForFilters(db, atrZoneDefaultQuery);
      compareApiToDb(
        [{ label: "pagination.total", apiValue: mapped.pagination.total, dbValue: dbCount }],
        "DB vs API — atr-zone total count",
        { ...obs, table: "general.aberration_cases", mode: "exact" },
      );
    },
  );

  test(
    "IND-RPT-ATZ-DB-002 — Sampled rows match DB field-for-field",
    { tag: ["@revenue-protection", "@atr-zone", "@db"] },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId("IND-RPT-ATZ-DB-002");
      const api = new AtrZoneApi(authenticatedApi);
      const { responseBody } = await api.getAtrZone({ ...atrZoneDefaultQuery, page: 1, limit: 100 });
      const mapped = AtrZoneMapper.mapData(responseBody.data);
      const withIvrs = mapped.rows.filter((row) => row.ivrs.trim());
      test.skip(withIvrs.length === 0, "No rows with ivrs to sample against DB");

      // NOTE: matching by row.id is NOT possible here — fetchAtrZoneRows
      // never selects ac.id. Business key (ivrs + eventName + amountBilled)
      // is the only reliable lookup, same as Cases.
      const sampleKeys = sampleRowIds(withIvrs.map((r) => r.ivrs), resolveDbSampleSize());

      for (const ivrsKey of sampleKeys) {
        const apiRow = withIvrs.find((r) => r.ivrs === ivrsKey)!;
        const dbRow = await getAtrZoneRowByBusinessKey(
          db,
          apiRow.ivrs.trim(),
          apiRow.eventName.trim(),
          apiRow.amountBilled,
        );
        expect(dbRow, `DB row missing for ivrs=${apiRow.ivrs} event=${apiRow.eventName}`).toBeTruthy();

        compareApiToDb(
          [
            { label: "ivrs", apiValue: apiRow.ivrs.trim(), dbValue: dbRow!.ivrs },
            { label: "eventName", apiValue: apiRow.eventName.trim() || null, dbValue: dbRow!.eventName },
            { label: "amountBilled", apiValue: apiRow.amountBilled, dbValue: dbRow!.amountBilled },
            { label: "amountRealised", apiValue: apiRow.amountRealised, dbValue: dbRow!.amountRealised },
            {
              label: "p4Number",
              apiValue: apiRow.p4Number.trim() || null,
              dbValue: dbRow!.p4Number,
              optional: true,
            },
          ],
          `DB vs API — ivrs=${apiRow.ivrs} event=${apiRow.eventName}`,
          { ...obs, table: "general.aberration_cases", mode: "exact" },
        );
      }
    },
  );
});