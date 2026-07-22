import { expect } from "@playwright/test";
import { test } from "../../../fixtures/observability.fixture";
import { compareApiToDb } from "../../../core/db/db-compare.engine";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { CasesApi } from "../Api/cases.api";
import { casesDefaultQuery } from "../Data/cases.data";
import { CasesMapper } from "../Mapper/cases.mapper";
import {countCasesForFilters,getCaseRowByBusinessKey,isCasesDbSqlReady,orgHierarchyExists,resolveDbSampleSize,sampleRowIds,} from "../Db/cases.db";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
/**
 * API vs DB cross-validation for revenue-protection cases.
 * Skips unless DB env is configured AND RP_CASES_DB_SQL_READY=true
 * (SQL placeholders must be confirmed with backend first).
 */
test.describe("Revenue Protection — Cases DB cross-validation", () => {
  test.describe.configure({ retries: 1, mode: "serial" });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);
  test.beforeEach(() => {
    test.skip(!isDbConfigured(), "DB credentials not configured");
    test.skip(
      !isCasesDbSqlReady(),
      "Set RP_CASES_DB_SQL_READY=true after confirming cases SQL against live schema",
    );
  });
  test("IND-RPT-DB-001 — COUNT(*) matches pagination.total",
    { tag: ["@revenue-protection", "@cases", "@db"] },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId("IND-RPT-DB-001");
      const api = new CasesApi(authenticatedApi);
      const { responseBody } = await api.getCases({
        ...casesDefaultQuery,
        page: 1,
        limit: 100,
      });
      const mapped = CasesMapper.mapData(responseBody.data);
      const dbCount = await countCasesForFilters(db, casesDefaultQuery);
      compareApiToDb(
        [
          {
            label: "pagination.total",
            apiValue: mapped.pagination.total,
            dbValue: dbCount,
          },
        ],
        "DB vs API — cases total count",
        { ...obs, table: "general.aberration_cases", mode: "exact" },
      );
    },
  );

  test("IND-RPT-DB-002 — Sampled rows match DB field-for-field",
    { tag: ["@revenue-protection", "@cases", "@db"] },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId("IND-RPT-DB-002");
      const api = new CasesApi(authenticatedApi);
      const { responseBody } = await api.getCases({
        ...casesDefaultQuery,
        page: 1,
        limit: 100,
      });
      const mapped = CasesMapper.mapData(responseBody.data);
      const withIvrs = mapped.rows.filter((row) => row.ivrsNo.trim());
      test.skip(
        withIvrs.length === 0,
        "No case rows with ivrsNo to sample against DB",
      );
      /**
       * API `id` is a page-local display key, not the UUID.
       * IVRS alone is not unique — match ivrs + event + amountBilled.
       */
      const sampleKeys = sampleRowIds(withIvrs.map((row) => row.id),resolveDbSampleSize(),);
      for (const rowId of sampleKeys) {
        const apiRow = withIvrs.find((row) => row.id === rowId)!;
        const dbRow = await getCaseRowByBusinessKey(
          db,
          apiRow.ivrsNo.trim(),
          apiRow.event.trim(),
          apiRow.amountBilled,
        );
        expect(dbRow,`DB row missing for ivrs=${apiRow.ivrsNo} event=${apiRow.event}`,).toBeTruthy();
        compareApiToDb(
          [
            {
              label: "ivrsNo",
              apiValue: apiRow.ivrsNo.trim(),
              dbValue: dbRow!.ivrsNo,
            },
            {
              label: "event",
              apiValue: apiRow.event.trim() || null,
              dbValue: dbRow!.event,
            },
            {
              label: "amountBilled",
              apiValue: apiRow.amountBilled,
              dbValue: dbRow!.amountBilled,
            },
            {
              label: "amountRealisation",
              apiValue: apiRow.amountRealisation,
              dbValue: dbRow!.amountRealisation,
            },
            {
              label: "p4Number",
              apiValue: apiRow.p4Number.trim() || null,
              dbValue: dbRow!.p4Number,
              optional: true,
            },
            {
              label: "status",
              apiValue: apiRow.status.trim().toUpperCase(),
              dbValue: dbRow!.status?.trim().toUpperCase() ?? null,
            },
          ],
          `DB vs API — ivrs=${apiRow.ivrsNo} event=${apiRow.event}`,
          { ...obs, table: "general.aberration_cases", mode: "exact" },
        );
      }
    },
  );
  test("IND-RPT-DB-003 — Circle/division/zone exist in org master",
    { tag: ["@revenue-protection", "@cases", "@db"] },
    async ({ authenticatedApi, db }) => {
      await applyAllureTestCaseId("IND-RPT-DB-003");
      const api = new CasesApi(authenticatedApi);
      const { responseBody } = await api.getCases({
        ...casesDefaultQuery,
        page: 1,
        limit: 100,
      });
      const mapped = CasesMapper.mapData(responseBody.data);
      test.skip(mapped.rows.length === 0, "No rows for hierarchy check");
      for (const row of mapped.rows) {
        if (!row.circle.trim()) {
          continue;
        }
        const exists = await orgHierarchyExists(
          db,
          row.circle,
          row.division,
          row.zone,
        );
        expect(exists.circle_ok, `Unknown circle: ${row.circle}`).toBeTruthy();
        if (row.division.trim()) {
          expect(
            exists.division_ok,
            `Unknown division: ${row.division}`,
          ).toBeTruthy();
        }
        if (row.zone.trim()) {
          expect(exists.zone_ok, `Unknown zone: ${row.zone}`).toBeTruthy();
        }
      }
    },
  );
});
