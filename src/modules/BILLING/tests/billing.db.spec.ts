import { expect } from "@playwright/test";
import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { logDbVsApiSection } from "../../../core/db/db-compare.engine";
import { isArchiveDbConfigured } from "../../../core/db/postgres.client";
import { BillingDataApi } from "../Api/billingdata.api";
import { BillingDataTestData } from "../Data/billingdata.data";
import { BillingDataMapper } from "../Mapper/billingdata.mapper";
import { BillingDataResponseSchema } from "../schemas/billing.schemas";
import { countBillingClassD3RowsInMonth } from "../Db/billing.db";
import {
  assertBillingMeterHeaderMatchesDb,
  firstBillingRowWithMeter,
} from "./billing-db.helpers";
import { BILLING_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

apiDbTest.describe("Billing — DB validation", () => {
  apiDbTest.describe.configure({ retries: 1, mode: "serial" });
  apiDbTest.setTimeout(BILLING_TEST_TIMEOUT_MS);

  apiDbTest(
    "Billing Data — first page row matches DB meter header",
    { tag: ["@billing", "@db"] },
    async ({ authenticatedApi, db }) => {
      const api = new BillingDataApi(authenticatedApi);
      const query = {
        month: BillingDataTestData.month,
        year: BillingDataTestData.year,
        page: BillingDataTestData.page,
        limit: BillingDataTestData.limit,
      };

      const { responseBody } = await api.getBillingData(
        query.month,
        query.year,
        query.page,
        query.limit,
      );

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
    "Billing Data — API total within archive Billing_Class_D3 month count",
    { tag: ["@billing", "@db"] },
    async ({ authenticatedApi, db: _db, archiveDb }) => {
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

      const { responseBody } = await api.getBillingData(
        query.month,
        query.year,
        query.page,
        query.limit,
      );

      const parsed = BillingDataResponseSchema.parse(responseBody);
      const data = BillingDataMapper.mapData(parsed.data, query);
      const apiTotal = data.total;
      const dbTotal = await countBillingClassD3RowsInMonth(
        archiveDb,
        query.year,
        query.month,
      );

      logDbVsApiSection(
        "Billing Data (archive Billing_Class_D3)",
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
        "JWT-scoped API total should not exceed unscoped archive month count",
      ).toBeLessThanOrEqual(dbTotal);
    },
  );
});
