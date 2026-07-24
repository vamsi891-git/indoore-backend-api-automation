/**
 * Wave-1 contract snapshots — structural only.
 * UPDATE_CONTRACT_SNAPSHOTS=true npm run test:<slug>:contract
 */
import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { NotificationsApi } from "../Api/notifications.api";
import { NotificationsData } from "../Data/notifications.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("NOTIFICATIONS — Contract Snapshots", () => {
  test.setTimeout(120_000);

  test(
    "Notifications List Contract Snapshot",
    { tag: ["@contract-snapshot", "@notifications"] },
    async ({ authenticatedApi }) => {
      const result = await new NotificationsApi(authenticatedApi).getNotifications(
        NotificationsData.page,
        NotificationsData.limit,
      );
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      const items = Array.isArray(data.notifications) ? data.notifications : [];
      await assertContractSnapshot(
        "notifications/notifications-list",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/notifications",
          dataKeys: Object.keys(data).sort(),
          itemKeys: items.length > 0 ? Object.keys(asRecord(items[0])).sort() : [],
        }),
      );
    },
  );
});
