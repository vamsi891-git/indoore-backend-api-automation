import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { CommandsHistoryApi } from "../Api/commands-history.api";
import { commandsHistoryData } from "../Data/commands-history.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

test.describe("HES-COMMANDS — Contract Snapshots", () => {
  test.setTimeout(180_000);

  test(
    "Commands History Contract Snapshot",
    { tag: ["@contract-snapshot", "@hes-commands"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } = await new CommandsHistoryApi(
        authenticatedApi,
      ).getHistory({
        page: commandsHistoryData.defaultPage,
        limit: commandsHistoryData.defaultLimit,
      });
      expect(rawResponse.status()).toBe(200);
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      const rows = Array.isArray(data.rows)
        ? data.rows
        : Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.history)
            ? data.history
            : [];
      await assertContractSnapshot(
        "hes-commands/commands-history",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/hes/commands/history",
          dataKeys: Object.keys(data).sort(),
          itemKeys: rows.length > 0 ? Object.keys(asRecord(rows[0])).sort() : [],
        }),
      );
    },
  );
});
