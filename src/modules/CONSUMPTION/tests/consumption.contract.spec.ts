import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { DailyConsumptionApi } from "../Api/dailyconsumption.api";
import { dailyConsumptionData } from "../Data/dailyconsumption.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("CONSUMPTION — Contract Snapshots", () => {
  test.setTimeout(180_000);

  test(
    "Daily Consumption Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumption"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } = await new DailyConsumptionApi(
        authenticatedApi,
      ).getDailyReport(
        dailyConsumptionData.page,
        dailyConsumptionData.limit,
        dailyConsumptionData.fromDate,
        dailyConsumptionData.toDate,
        dailyConsumptionData.month,
        dailyConsumptionData.year,
      );
      expect(rawResponse.status()).toBe(200);
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      const rows = Array.isArray(data.rows)
        ? data.rows
        : Array.isArray(data.items)
          ? data.items
          : [];
      await assertContractSnapshot(
        "consumption/daily-consumption",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/consumption/report",
          dataKeys: Object.keys(data).sort(),
          itemKeys: rows.length > 0 ? Object.keys(asRecord(rows[0])).sort() : [],
        }),
      );
    },
  );
});
