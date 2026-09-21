import { expect } from "@playwright/test";
import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { logDbVsApiSection } from "../../../extras/db/db-compare.engine";
import { isArchiveDbConfigured } from "../../../extras/db/postgres.client";
import { BillingDataApi } from "../Api/billingdata.api";
import { BillingDataTestData } from "../Data/billingdata.data";
import { BillingDataMapper } from "../Mapper/billingdata.mapper";
import { BillingDataResponseSchema } from "../schemas/billing.schemas";
import { countBillingArchiveUniverseDistinct } from "../Db/billing.db";
import { assertBillingMeterHeaderMatchesDb, firstBillingRowWithMeter } from "./billing-db.helpers";
import { BILLING_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

apiDbTest.describe("Monthly billing vs database", () => {
  apiDbTest.describe.configure({ retries: 1, mode: "serial" });
  apiDbTest.setTimeout(BILLING_TEST_TIMEOUT_MS);

  apiDbTest(
    "Monthly billing — first page meter name and IVRS match the database",
    { tag: ["@billing", "@db"] },
    async ({ authenticatedApi, db }) => {
      const api = new BillingDataApi(authenticatedApi);
      const query = {
        month: BillingDataTestData.month,
        year: BillingDataTestData.year,
        page: BillingDataTestData.page,
        limit: BillingDataTestData.limit,
      };

      const { responseBody } = await api.getBillingData(query);

      const parsed = BillingDataResponseSchema.parse(responseBody);
      const data = BillingDataMapper.mapData(parsed.data, query);
      const apiRow = firstBillingRowWithMeter(data.items);

      if (!apiRow?.meterNumber?.trim()) {
        apiDbTest.skip(true, "No billing row with meter on page 1 for DB spot check");
        return;
      }

      await assertBillingMeterHeaderMatchesDb(db, apiRow);
    },
  );

  apiDbTest(
    "Monthly billing — billed meter count is not higher than the archive database",
    { tag: ["@billing", "@db"] },
    async ({ authenticatedApi, db, archiveDb }) => {
      if (!isArchiveDbConfigured()) {
        apiDbTest.skip(true, "DB_ARCHIVE_NAME not configured — archive billing check skipped");
        return;
      }

      const api = new BillingDataApi(authenticatedApi);
      const query = {
        month: BillingDataTestData.month,
        year: BillingDataTestData.year,
        page: BillingDataTestData.page,
        limit: BillingDataTestData.limit,
      };

      const { responseBody } = await api.getBillingData(query);

      const parsed = BillingDataResponseSchema.parse(responseBody);
      const data = BillingDataMapper.mapData(parsed.data, query);
      const apiTotal = data.total;
      if (apiTotal == null) {
        apiDbTest.skip(
          true,
          "Billing data total is null — skip archive count until includeTotal returns a number",
        );
        return;
      }
      // Live total = DISTINCT serial across D1∪D2∪D3 (1st-of-month midnight) minus DT meters.
      // Unscoped JWT may still filter further — API must never exceed this universe.
      const dbTotal = await countBillingArchiveUniverseDistinct(
        archiveDb,
        db,
        query.year,
        query.month,
      );

      logDbVsApiSection(
        "Billing Data (archive D1∪D2∪D3 minus DT)",
        {
          total: apiTotal,
          page: query.page,
          limit: query.limit,
          rowCount: data.items.length,
        },
        { total: dbTotal },
        { totalMode: "lte" },
      );

      expect(
        apiTotal,
        "API total must not exceed archive universe (D1∪D2∪D3 minus DT)",
      ).toBeLessThanOrEqual(dbTotal);
      if (apiTotal !== dbTotal) {
        console.log(
          `BACKEND FINDING: billing API total=${apiTotal} < archive DB=${dbTotal} (delta=${dbTotal - apiTotal}) — JWT scope / shared-DB check`,
        );
      }
    },
  );
});
