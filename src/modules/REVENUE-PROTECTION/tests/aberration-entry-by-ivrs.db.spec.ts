import { expect } from "@playwright/test";
import { test } from "../../../fixtures/observability.fixture";
import { compareApiToDb } from "../../../core/db/db-compare.engine";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { AberrationEntryApi } from "../Api/aberration-entry.api";
import {
  aberrationEntryUnknownIvrs,
  buildAberrationEntryUpdatePayload,
} from "../Data/aberration-entry-by-ivrs.data";
import { AberrationEntryByIvrsMapper } from "../Mapper/aberration-entry-by-ivrs.mapper";
import {
  countAberrationEntryByIvrs,
  getLatestAberrationEntryByIvrs,
  isAberrationEntryDbSqlReady,
} from "../Db/aberration-entry.db";
import { resolveAberrationEntryIvrsForUpdate } from "../utils/aberration-entry-by-ivrs.helper";

test.describe("Revenue Protection — Aberration Entry By IVRS DB cross-validation", () => {
  test.describe.configure({
    retries: 1,
    mode: "serial",
  });

  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  test.beforeEach(() => {
    test.skip(!isDbConfigured(), "DB credentials not configured");

    test.skip(
      !isAberrationEntryDbSqlReady(),
      "Set RP_ABERRATION_ENTRY_DB_SQL_READY=true after validating SQL against live schema",
    );
  });

  test("IND-REV-ABE-IVRS-DB-001 — PATCH then spot-check updated fields in DB",
    {
      tag: ["@revenue-protection", "@aberration-entry-by-ivrs", "@db"],
    },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId("IND-REV-ABE-IVRS-DB-001");
      const ivrsNo = await resolveAberrationEntryIvrsForUpdate(authenticatedApi);
      const payload = buildAberrationEntryUpdatePayload({
        remarks: "db-cross-check",
        amountBilled: 111,
        amountRealised: 55,
        mrTransactionNo: "DB-MR-001",
        fieldOfficerName: "DB Officer",
        fieldOfficerDesignation: "AE",
        fieldOfficerRemarks: "db remarks",
      });
      const api = new AberrationEntryApi(authenticatedApi);
      const { responseBody } = await api.patchAberrationEntryByIvrs(ivrsNo, payload);
      const mapped = AberrationEntryByIvrsMapper.mapData(responseBody.data);
      expect(mapped.ivrsNo.trim().toLowerCase()).toBe(ivrsNo.trim().toLowerCase());
      const row = await getLatestAberrationEntryByIvrs(db, ivrsNo);
      expect(row, `Missing DB row for IVRS=${ivrsNo}`).toBeTruthy();
      compareApiToDb(
        [
          {
            label: "ivrs",
            apiValue: ivrsNo.trim(),
            dbValue: row!.ivrs,
          },
          {
            label: "amountBilled",
            apiValue: payload.amountBilled,
            dbValue: row!.amountBilled,
          },
          {
            label: "amountRealised",
            apiValue: payload.amountRealised,
            dbValue: row!.amountRealised,
          },
          {
            label: "remarks",
            apiValue: payload.remarks,
            dbValue: row!.remarks,
            optional: true,
          },
          {
            label: "fieldOfficerName",
            apiValue: payload.fieldOfficerName,
            dbValue: row!.fieldOfficerName,
            optional: true,
          },
          {
            label: "mrTransactionNo",
            apiValue: payload.mrTransactionNo,
            dbValue: row!.mrTransactionNo,
            optional: true,
          },
        ],
        `DB vs API — PATCH By IVRS (${ivrsNo})`,
        {
          ...obs,
          table: "general.aberration_cases",
          mode: "exact",
        },
      );
    },
  );

  test("IND-REV-ABE-IVRS-DB-002 — Unknown IVRS has zero DB rows",
    {
      tag: ["@revenue-protection", "@aberration-entry-by-ivrs", "@db"],
    },
    async ({ db, obs }) => {
      await applyAllureTestCaseId("IND-REV-ABE-IVRS-DB-002");

      const dbCount = await countAberrationEntryByIvrs(
        db,
        aberrationEntryUnknownIvrs,
      );

      compareApiToDb(
        [
          {
            label: "unknownIvrsCount",
            apiValue: 0,
            dbValue: dbCount,
          },
        ],
        `DB — Unknown IVRS has no rows (${aberrationEntryUnknownIvrs})`,
        {
          ...obs,
          table: "general.aberration_cases",
          mode: "exact",
        },
      );
    },
  );
});
