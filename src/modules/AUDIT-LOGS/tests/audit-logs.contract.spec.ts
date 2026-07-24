import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { AuditLogsApi } from "../Api/auditlogs.api";
import { auditLogsDefaultQuery } from "../Data/auditlogs.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("AUDIT-LOGS — Contract Snapshots", () => {
  test.setTimeout(120_000);

  test(
    "Audit Logs List Contract Snapshot",
    { tag: ["@contract-snapshot", "@audit-logs"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } = await new AuditLogsApi(
        authenticatedApi,
      ).getAuditLogs({ ...auditLogsDefaultQuery });
      expect(rawResponse.status()).toBe(200);
      expect(responseBody.success).toBe(true);
      const data = asRecord(responseBody.data);
      const logs = Array.isArray(data.logs) ? data.logs : [];
      await assertContractSnapshot(
        "audit-logs/audit-logs-list",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/users/audit-logs",
          dataKeys: Object.keys(data).sort(),
          itemKeys: logs.length > 0 ? Object.keys(asRecord(logs[0])).sort() : [],
        }),
      );
    },
  );
});
