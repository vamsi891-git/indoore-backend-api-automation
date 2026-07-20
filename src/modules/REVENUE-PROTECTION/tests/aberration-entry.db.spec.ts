import { expect } from "@playwright/test";
import { test } from "../../../fixtures/observability.fixture";
import { compareApiToDb } from "../../../core/db/db-compare.engine";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { AberrationEntryApi } from "../Api/aberration-entry.api";
import { aberrationEntryDefaultQuery } from "../Data/aberration-entry.data";
import { AberrationEntryMapper } from "../Mapper/aberration-entry.mapper";
import {
  countAberrationEntryForFilters,
  getAberrationEntryRowByBusinessKey,
  isAberrationEntryDbSqlReady,
  resolveDbSampleSize,
  sampleRowIds,
} from "../Db/aberration-entry.db";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";

test.describe("Revenue Protection — Aberration Entry DB cross-validation", () => {
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

  test(
    "IND-REV-ABE-ENTRY-DB-001 — COUNT(*) matches pagination.total",
    {
      tag: [
        "@revenue-protection",
        "@aberration-entry",
        "@db",
      ],
    },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId(
        "IND-REV-ABE-ENTRY-DB-001",
      );

      const api = new AberrationEntryApi(authenticatedApi);

      const { responseBody } =
        await api.getAberrationEntry({
          ...aberrationEntryDefaultQuery,
          page: 1,
          limit: 100,
        });

      const mapped =
        AberrationEntryMapper.mapData(
          responseBody.data,
        );

      const dbCount =
        await countAberrationEntryForFilters(
          db,
          aberrationEntryDefaultQuery,
        );

      compareApiToDb(
        [
          {
            label: "pagination.total",
            apiValue: mapped.pagination.total,
            dbValue: dbCount,
          },
        ],
        "DB vs API — Aberration Entry total count",
        {
          ...obs,
          table: "general.aberration_cases",
          mode: "exact",
        },
      );
    },
  );

  test(
    "IND-REV-ABE-ENTRY-DB-002 — Sampled rows match DB",
    {
      tag: [
        "@revenue-protection",
        "@aberration-entry",
        "@db",
      ],
    },
    async ({ authenticatedApi, db, obs }) => {
      await applyAllureTestCaseId(
        "IND-REV-ABE-ENTRY-DB-002",
      );

      const api = new AberrationEntryApi(
        authenticatedApi,
      );

      const { responseBody } =
        await api.getAberrationEntry({
          ...aberrationEntryDefaultQuery,
          page: 1,
          limit: 100,
        });

      const mapped =
        AberrationEntryMapper.mapData(
          responseBody.data,
        );

      const rowsWithIvrs =
        mapped.rows.filter(
          (row) => row.ivrsNo.trim().length > 0,
        );

      test.skip(
        rowsWithIvrs.length === 0,
        "No IVRS rows available for DB validation",
      );

      /**
       * Repository does not expose a stable API row UUID
       * for lookup.
       *
       * Business Key:
       *
       * IVRS +
       * Event Name +
       * Amount Billed
       */
      const sampleIvrs =
        sampleRowIds(
          rowsWithIvrs.map((r) => r.ivrsNo),
          resolveDbSampleSize(),
        );

      for (const ivrs of sampleIvrs) {
        const apiRow =
          rowsWithIvrs.find(
            (r) => r.ivrsNo === ivrs,
          )!;

        const dbRow =
          await getAberrationEntryRowByBusinessKey(
            db,
            apiRow.ivrsNo.trim(),
            apiRow.eventName.trim(),
            apiRow.amountBilled,
            "ZONE_OFFICE",
          );

        expect(
          dbRow,
          `Missing DB row for IVRS=${apiRow.ivrsNo}`,
        ).toBeTruthy();

        compareApiToDb(
          [
            {
              label: "ivrs",
              apiValue: apiRow.ivrsNo.trim(),
              dbValue: dbRow!.ivrs,
            },
            {
              label: "eventName",
              apiValue:
                apiRow.eventName.trim() || null,
              dbValue: dbRow!.eventName,
            },
            {
              label: "amountBilled",
              apiValue: apiRow.amountBilled,
              dbValue: dbRow!.amountBilled,
            },
            {
              label: "amountRealised",
              apiValue: apiRow.amountRealised,
              dbValue: dbRow!.amountRealised,
            },
            {
              label: "remarks",
              apiValue:
                apiRow.remarks.trim() || null,
              dbValue: dbRow!.remarks,
              optional: true,
            },
            {
              label: "fieldOfficerRemarks",
              apiValue:
                apiRow.fieldOfficerRemarks.trim() ||
                null,
              dbValue:
                dbRow!.fieldOfficerRemarks,
              optional: true,
            },
            {
              label: "fieldOfficerName",
              apiValue:
                apiRow.fieldOfficerName.trim() ||
                null,
              dbValue:
                dbRow!.fieldOfficerName,
              optional: true,
            },
            {
              label:
                "fieldOfficerDesignation",
              apiValue:
                apiRow.fieldOfficerDesignation.trim() ||
                null,
              dbValue:
                dbRow!
                  .fieldOfficerDesignation,
              optional: true,
            },
            {
              label: "mrTransactionNo",
              apiValue:
                apiRow.mrTransactionNo.trim() ||
                null,
              dbValue:
                dbRow!.mrTransactionNo,
              optional: true,
            },
            {
              label: "p4No",
              apiValue:
                apiRow.p4No.trim() || null,
              dbValue: dbRow!.p4No,
              optional: true,
            },
          ],
          `DB vs API — IVRS=${apiRow.ivrsNo}`,
          {
            ...obs,
            table: "general.aberration_cases",
            mode: "exact",
          },
        );
      }
    },
  );
});