import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { CommercialSummaryApi } from "../Api/commercial-summary.api";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("COMMERICIAL-ANALYSIS — Contract Snapshots", () => {
  test.setTimeout(180_000);

  test(
    "Commercial Summary Contract Snapshot",
    { tag: ["@contract-snapshot", "@commericial-analysis"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } = await new CommercialSummaryApi(
        authenticatedApi,
      ).getCommercialSummary(12, 2025, 0.85);
      expect(rawResponse.status()).toBe(200);
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "commericial-analysis/commercial-summary",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/analysis/commercial/summary",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(data).sort(),
        }),
      );
    },
  );
});
