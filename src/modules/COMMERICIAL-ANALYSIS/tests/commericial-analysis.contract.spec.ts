import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { CommercialSummaryApi } from "../Api/commercial-summary.api";
import { commercialSummaryData } from "../Data/commercial-summary.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("Commercial Analysis — dashboard response shape", () => {
  test.setTimeout(180_000);

  test(
    "Dashboard — the list of fields in the response stays the same",
    { tag: ["@contract-snapshot", "@commericial-analysis"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } = await new CommercialSummaryApi(
        authenticatedApi,
      ).getCommercialSummary(
        commercialSummaryData.month,
        commercialSummaryData.year,
        commercialSummaryData.pfThreshold,
      );
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
