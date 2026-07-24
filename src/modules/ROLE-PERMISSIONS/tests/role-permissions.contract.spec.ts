import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { RolePermissionApi } from "../Api/rolepermission.api";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("ROLE-PERMISSIONS — Contract Snapshots", () => {
  test.setTimeout(120_000);

  test(
    "Roles Catalog Contract Snapshot",
    { tag: ["@contract-snapshot", "@role-permissions"] },
    async ({ authenticatedApi }) => {
      const result = await new RolePermissionApi(authenticatedApi).getRoles();
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      const roles = Array.isArray(data.roles) ? data.roles : [];
      await assertContractSnapshot(
        "role-permissions/roles-list",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/permissions/roles",
          dataKeys: Object.keys(data).sort(),
          itemKeys: roles.length > 0 ? Object.keys(asRecord(roles[0])).sort() : [],
        }),
      );
    },
  );
});
