/**
 * BILLING contract snapshots — structural only (kWh / totals drift).
 *
 *   UPDATE_CONTRACT_SNAPSHOTS=true npm run test:billing:contract
 */
import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { BillingDataApi } from "../Api/billingdata.api";
import { DaywiseBillingApi } from "../Api/daywisebilling.api";
import { BillingDataTestData } from "../Data/billingdata.data";
import { DaywiseBillingTestData } from "../Data/daywisebilling.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("BILLING — Contract Snapshots", () => {
  test.setTimeout(180_000);

  test(
    "Billing Data Contract Snapshot",
    { tag: ["@contract-snapshot", "@billing", "@billing-data"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new BillingDataApi(
        authenticatedApi,
      ).getBillingData(
        BillingDataTestData.month,
        BillingDataTestData.year,
        BillingDataTestData.page,
        BillingDataTestData.limit,
      );
      expect(responseBody.success).toBe(true);
      const data = asRecord(responseBody.data);
      const rows = Array.isArray(data.rows)
        ? data.rows
        : Array.isArray(data.items)
          ? data.items
          : [];
      await assertContractSnapshot(
        "billing/billing-data",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/billing/billing-data",
          dataKeys: Object.keys(data).sort(),
          itemKeys: rows.length > 0 ? Object.keys(asRecord(rows[0])).sort() : [],
        }),
      );
    },
  );

  test(
    "Daywise Billing Contract Snapshot",
    { tag: ["@contract-snapshot", "@billing", "@daywise-billing"] },
    async ({ authenticatedApi }) => {
      const { responseBody } = await new DaywiseBillingApi(
        authenticatedApi,
      ).getDaywiseBillingData(
        DaywiseBillingTestData.month,
        DaywiseBillingTestData.year,
        true,
        DaywiseBillingTestData.page,
        DaywiseBillingTestData.limit,
      );
      expect(responseBody.success).toBe(true);
      const data = asRecord(responseBody.data);
      const rows = Array.isArray(data.rows)
        ? data.rows
        : Array.isArray(data.items)
          ? data.items
          : [];
      await assertContractSnapshot(
        "billing/daywise-billing-data",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/billing/daywise-billing-data",
          dataKeys: Object.keys(data).sort(),
          itemKeys: rows.length > 0 ? Object.keys(asRecord(rows[0])).sort() : [],
        }),
      );
    },
  );
});
