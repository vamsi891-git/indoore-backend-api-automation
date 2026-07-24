/**
 * AUTH contract snapshots — structural only (IDs/tokens drift).
 *
 * First run / intentional shape change:
 *   UPDATE_CONTRACT_SNAPSHOTS=true npm run test:auth:contract
 */
import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { AuthSessionApi } from "../Api/auth-session.api";
import { InviteApi } from "../Api/invite.api";
import { AuthPaths } from "../Data/auth.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("AUTH — Contract Snapshots", () => {
  test.setTimeout(120_000);

  test(
    "Auth Me Contract Snapshot",
    { tag: ["@contract-snapshot", "@auth", "@me"] },
    async ({ authenticatedApi }) => {
      const result = await new AuthSessionApi(authenticatedApi).getMe();
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "auth/me",
        buildLookupItemsContractSnapshot({
          pathPattern: AuthPaths.me,
          dataKeys: Object.keys(data).sort(),
          itemKeys: Object.keys(asRecord(data.user)).sort(),
        }),
      );
    },
  );

  test(
    "Auth Devices Contract Snapshot",
    { tag: ["@contract-snapshot", "@auth", "@devices"] },
    async ({ authenticatedApi }) => {
      const result = await new AuthSessionApi(authenticatedApi).getDevices();
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      const groups = Array.isArray(data.deviceGroups) ? data.deviceGroups : [];
      const firstGroup = groups.length > 0 ? asRecord(groups[0]) : {};
      const devices = Array.isArray(firstGroup.devices) ? firstGroup.devices : [];
      const itemKeys =
        devices.length > 0
          ? Object.keys(asRecord(devices[0])).sort()
          : Object.keys(firstGroup).sort();
      await assertContractSnapshot(
        "auth/devices",
        buildLookupItemsContractSnapshot({
          pathPattern: AuthPaths.devices,
          dataKeys: Object.keys(data).sort(),
          itemKeys,
        }),
      );
    },
  );

  test(
    "Auth Sent Invitations Contract Snapshot",
    { tag: ["@contract-snapshot", "@auth", "@invite"] },
    async ({ authenticatedApi }) => {
      const result = await new InviteApi(authenticatedApi).listMyInvitations({
        page: 1,
        limit: 20,
        status: "all",
      });
      expect(result.rawResponse.status()).toBe(200);
      const body = asRecord(result.responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      const invitations = Array.isArray(data.invitations) ? data.invitations : [];
      await assertContractSnapshot(
        "auth/invitations-mine",
        buildLookupItemsContractSnapshot({
          pathPattern: AuthPaths.invitationsMine,
          dataKeys: Object.keys(data).sort(),
          itemKeys:
            invitations.length > 0
              ? Object.keys(asRecord(invitations[0])).sort()
              : Object.keys(asRecord(data.summary)).sort(),
        }),
      );
    },
  );
});
