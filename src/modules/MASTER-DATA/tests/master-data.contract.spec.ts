/**
 * MASTER-DATA contract snapshots — structural only (counts/IDs drift).
 *
 * First run / intentional shape change:
 *   UPDATE_CONTRACT_SNAPSHOTS=true npm run test:master-data:contract
 */
import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { MeterMasterApi } from "../Api/meter-master.api";
import { DtrMasterApi } from "../Api/dtr-master.api";
import { ConsumerMasterApi } from "../Api/consumer-master.api";
import { FeederMasterApi } from "../Api/feeder-master.api";
import { SubstationMasterApi } from "../Api/substation-master.api";
import { MeterCommunicationStatusApi } from "../Api/meter-communication-status.api";
import { MasterDataAuditLogsApi } from "../Api/master-data-audit-logs.api";
import {
  masterDataDefaultQuery,
  meterMasterDefaultQuery,
} from "../Data/master-data.common.data";
import { masterDataAuditLogsDefaultQuery } from "../Data/master-data-audit-logs.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function listRows(data: Record<string, unknown>): unknown[] {
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.logs)) return data.logs;
  return [];
}

async function snapshotList(
  name: string,
  pathPattern: string,
  responseBody: unknown,
): Promise<void> {
  const body = asRecord(responseBody);
  expect(body.success).toBe(true);
  const data = asRecord(body.data);
  const rows = listRows(data);
  await assertContractSnapshot(
    name,
    buildLookupItemsContractSnapshot({
      pathPattern,
      dataKeys: Object.keys(data).sort(),
      itemKeys: rows.length > 0 ? Object.keys(asRecord(rows[0])).sort() : [],
    }),
  );
}

test.describe("Master data — column names in the response", () => {
  test.setTimeout(180_000);

  test(
    "Meter list — column names in the response stay the same",
    { tag: ["@contract-snapshot", "@master-data", "@meter-master"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } = await new MeterMasterApi(
        authenticatedApi,
      ).getMeterMasterData({ ...meterMasterDefaultQuery });
      expect(rawResponse.status()).toBe(200);
      await snapshotList(
        "master-data/meter-master",
        "/indore/master-data/meter-master-data",
        responseBody,
      );
    },
  );

  test(
    "DTR list — column names in the response stay the same",
    { tag: ["@contract-snapshot", "@master-data", "@dtr-master"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } = await new DtrMasterApi(
        authenticatedApi,
      ).getDtrMasterData({ ...masterDataDefaultQuery });
      expect(rawResponse.status()).toBe(200);
      await snapshotList(
        "master-data/dtr-master",
        "/indore/master-data/dtr-master-data",
        responseBody,
      );
    },
  );

  test(
    "Consumer list — column names in the response stay the same",
    { tag: ["@contract-snapshot", "@master-data", "@consumer-master"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } = await new ConsumerMasterApi(
        authenticatedApi,
      ).getConsumerMasterData({ ...masterDataDefaultQuery, meterType: "all" });
      expect(rawResponse.status()).toBe(200);
      await snapshotList(
        "master-data/consumer-master",
        "/indore/master-data/consumer-master-data",
        responseBody,
      );
    },
  );

  test(
    "Feeder list — column names in the response stay the same",
    { tag: ["@contract-snapshot", "@master-data", "@feeder-master"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } = await new FeederMasterApi(
        authenticatedApi,
      ).getFeederMasterData({ ...masterDataDefaultQuery });
      expect(rawResponse.status()).toBe(200);
      await snapshotList(
        "master-data/feeder-master",
        "/indore/master-data/feeder-master-data",
        responseBody,
      );
    },
  );

  test(
    "Substation list — column names in the response stay the same",
    { tag: ["@contract-snapshot", "@master-data", "@substation-master"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } = await new SubstationMasterApi(
        authenticatedApi,
      ).getSubstationMasterData({ ...masterDataDefaultQuery });
      expect(rawResponse.status()).toBe(200);
      await snapshotList(
        "master-data/substation-master",
        "/indore/master-data/substation-master-data",
        responseBody,
      );
    },
  );

  test(
    "Meter communication — column names in the response stay the same",
    { tag: ["@contract-snapshot", "@master-data", "@meter-communication"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } =
        await new MeterCommunicationStatusApi(
          authenticatedApi,
        ).getMeterCommunicationStatus({ ...masterDataDefaultQuery });
      expect(rawResponse.status()).toBe(200);
      await snapshotList(
        "master-data/meter-communication",
        "/indore/master-data/meter-communication-status",
        responseBody,
      );
    },
  );

  test(
    "Master data change history — column names in the response stay the same",
    { tag: ["@contract-snapshot", "@master-data", "@audit-logs"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } = await new MasterDataAuditLogsApi(
        authenticatedApi,
      ).getAuditLogs({ ...masterDataAuditLogsDefaultQuery });
      expect(rawResponse.status()).toBe(200);
      await snapshotList(
        "master-data/audit-logs",
        "/indore/master-data/audit-logs",
        responseBody,
      );
    },
  );
});
