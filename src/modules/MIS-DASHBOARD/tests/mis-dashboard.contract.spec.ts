import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { CommStatsApi } from "../Api/communication.api";
import { commStatsQuery } from "../Data/communication.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("MIS-DASHBOARD — Contract Snapshots", () => {
  test.setTimeout(180_000);

  test(
    "Communication Stats Contract Snapshot",
    { tag: ["@contract-snapshot", "@mis-dashboard"] },
    async ({ authenticatedApi }) => {
      const result = await new CommStatsApi(authenticatedApi).getCommStats({
        ...commStatsQuery,
      });
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "mis-dashboard/communication",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/mis-dashboard/communication",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );
});
