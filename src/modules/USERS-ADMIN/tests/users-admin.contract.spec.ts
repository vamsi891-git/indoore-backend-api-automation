import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { UserManagementApi } from "../Api/usermanagement.api";
import { UserManagementData } from "../Data/usermanagement.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("USERS-ADMIN — Contract Snapshots", () => {
  test.setTimeout(120_000);

  test(
    "Users List Contract Snapshot",
    { tag: ["@contract-snapshot", "@users-admin"] },
    async ({ authenticatedApi }) => {
      const result = await new UserManagementApi(authenticatedApi).getUsers(
        UserManagementData.page,
        UserManagementData.limit,
      );
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      const users = Array.isArray(data.users) ? data.users : [];
      await assertContractSnapshot(
        "users-admin/users-list",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/users",
          dataKeys: Object.keys(data).sort(),
          itemKeys: users.length > 0 ? Object.keys(asRecord(users[0])).sort() : [],
        }),
      );
    },
  );
});
