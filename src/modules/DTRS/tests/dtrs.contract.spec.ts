import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { DtrProfileApi } from "../Api/dtrprofile.api";
import { dtrProfileDefaultCode } from "../Data/dtrprofile.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("DTRS — Contract Snapshots", () => {
  test.setTimeout(120_000);

  test(
    "DTR Profile Contract Snapshot",
    { tag: ["@contract-snapshot", "@dtrs"] },
    async ({ authenticatedApi }) => {
      const code = process.env.DTR_CODE?.trim() || dtrProfileDefaultCode;
      const result = await new DtrProfileApi(authenticatedApi).getProfile(code);
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "dtrs/dtr-profile",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/dtr/{dtrCode}/profile",
          dataKeys: Object.keys(data).sort(),
          itemKeys: Array.isArray(data.overview) && data.overview.length > 0
            ? Object.keys(asRecord(data.overview[0])).sort()
            : Object.keys(data).sort(),
        }),
      );
    },
  );
});
