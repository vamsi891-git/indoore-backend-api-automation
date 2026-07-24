import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { ModulePermissionApi } from "../Api/modulepermission.api";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("MODULES-PERMISSIONS — Contract Snapshots", () => {
  test.setTimeout(120_000);

  test(
    "Modules Catalog Contract Snapshot",
    { tag: ["@contract-snapshot", "@modules-permissions"] },
    async ({ authenticatedApi }) => {
      const result = await new ModulePermissionApi(authenticatedApi).getModules();
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      const modules = Array.isArray(data.modules) ? data.modules : [];
      await assertContractSnapshot(
        "modules-permissions/modules-list",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/permissions/modules",
          dataKeys: Object.keys(data).sort(),
          itemKeys:
            modules.length > 0 ? Object.keys(asRecord(modules[0])).sort() : [],
        }),
      );
    },
  );
});
