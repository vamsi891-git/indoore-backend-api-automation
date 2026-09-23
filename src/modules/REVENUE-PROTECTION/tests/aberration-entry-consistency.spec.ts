import { expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { AberrationEntryApi } from "../Api/aberration-entry.api";
import {
  ABERRATION_ENTRY_ACTION_STATUSES,
  ABERRATION_ENTRY_CONSISTENCY_BASELINES,
  ABERRATION_ENTRY_EVENT_NAMES,
} from "../Data/aberration-entry.data";
import type { AberrationEntryQuery } from "../Mapper/aberration-entry.mapper";
import { AberrationEntryMapper } from "../Mapper/aberration-entry.mapper";

const NETWORK_SEARCH_PATH = "/indore/utils/search/networks?limit=2000&hierarchyId=2";

async function loadNetworkIds(authenticatedApi: APIRequestContext): Promise<number[]> {
  const networksResponse = await authenticatedApi.get(NETWORK_SEARCH_PATH, {
    timeout: 120_000,
  });
  expect(networksResponse.status()).toBe(200);
  const networksBody = (await networksResponse.json()) as {
    success?: boolean;
    data?: { items?: Array<{ id?: number }> };
  };
  expect(networksBody.success).toBeTruthy();
  const networkIds = (networksBody.data?.items ?? [])
    .map((item) => Number(item.id))
    .filter((id) => Number.isFinite(id) && id > 0);
  expect(networkIds.length, "networks list must be non-empty").toBeGreaterThan(0);
  return networkIds;
}

/** Never soft-skip — empty baselines still assert count matches (0 === 0). */
async function loadBaseline(api: AberrationEntryApi, query: AberrationEntryQuery) {
  const baselineResult = await api.getAberrationEntry(query);
  expect(baselineResult.rawResponse.status(), "org/baseline HTTP must be 200").toBe(200);
  expect(baselineResult.responseBody.success, "org/baseline success must be true").toBeTruthy();
  return AberrationEntryMapper.mapData(baselineResult.responseBody.data);
}

test.describe("Revenue Protection — Aberration Entry filter consistency", () => {
  test.describe.configure({ retries: 0 });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  for (const baseline of ABERRATION_ENTRY_CONSISTENCY_BASELINES) {
    test(
      `${baseline.label}: COMPLETED + PENDING equals October 2025 total`,
      {
        tag: ["@revenue-protection", "@aberration-entry", baseline.tag, "@consistency"],
      },
      async ({ authenticatedApi }) => {
        const api = new AberrationEntryApi(authenticatedApi);
        const mapped = await loadBaseline(api, baseline.query);
        const baselineTotal = mapped.pagination.total;

        let sum = 0;
        const perStatus: Array<{ actionStatus: string; total: number }> = [];
        for (const actionStatus of ABERRATION_ENTRY_ACTION_STATUSES) {
          const { rawResponse, responseBody } = await api.getAberrationEntry({
            ...baseline.query,
            actionStatus,
          });
          expect(rawResponse.status(), `HTTP for actionStatus=${actionStatus}`).toBe(200);
          expect(responseBody.success).toBeTruthy();
          const total = AberrationEntryMapper.mapData(responseBody.data).pagination.total;
          perStatus.push({ actionStatus, total });
          sum += total;
        }

        console.log(
          `[${baseline.label}] baselineTotal=${baselineTotal} statusSum=${sum} perStatus=${JSON.stringify(perStatus)}`,
        );
        expect(
          sum,
          `${baseline.label}: COMPLETED+PENDING (${sum}) must equal baseline total (${baselineTotal}) — mismatch is a hard fail`,
        ).toEqual(baselineTotal);
      },
    );

    test(
      `${baseline.label}: sum of eventName totals equals October 2025 total`,
      {
        tag: ["@revenue-protection", "@aberration-entry", baseline.tag, "@consistency"],
      },
      async ({ authenticatedApi }) => {
        test.setTimeout(15 * 60_000);
        const api = new AberrationEntryApi(authenticatedApi);
        const mapped = await loadBaseline(api, baseline.query);
        const baselineTotal = mapped.pagination.total;

        let sum = 0;
        const perEvent: Array<{ eventName: string; total: number }> = [];
        for (const eventName of ABERRATION_ENTRY_EVENT_NAMES) {
          const { rawResponse, responseBody } = await api.getAberrationEntry({
            ...baseline.query,
            eventName,
          });
          expect(rawResponse.status(), `HTTP for eventName=${eventName}`).toBe(200);
          expect(responseBody.success).toBeTruthy();
          const total = AberrationEntryMapper.mapData(responseBody.data).pagination.total;
          perEvent.push({ eventName, total });
          sum += total;
        }

        console.log(
          `[${baseline.label}] baselineTotal=${baselineTotal} eventSum=${sum} perEvent=${JSON.stringify(perEvent.filter((e) => e.total > 0))}`,
        );
        expect(
          sum,
          `${baseline.label}: eventName sum (${sum}) must equal baseline total (${baselineTotal}) — mismatch is a hard fail`,
        ).toEqual(baselineTotal);
      },
    );

    test(
      `${baseline.label}: org vs network data presence must match both ways (hierarchyId=2)`,
      {
        tag: [
          "@revenue-protection",
          "@aberration-entry",
          baseline.tag,
          "@consistency",
          baseline.networkTag,
        ],
      },
      async ({ authenticatedApi }) => {
        test.setTimeout(45 * 60_000);
        const api = new AberrationEntryApi(authenticatedApi);
        const mapped = await loadBaseline(api, baseline.query);
        const orgTotal = mapped.pagination.total;
        const networkIds = await loadNetworkIds(authenticatedApi);

        const emptyNetworks: number[] = [];
        const withDataNetworks: Array<{ id: number; total: number }> = [];
        const errors: Array<{ id: number; status: number }> = [];

        for (const networkLookupId of networkIds) {
          const { rawResponse, responseBody } = await api.getAberrationEntry({
            ...baseline.query,
            networkLookupId,
          });
          if (rawResponse.status() !== 200 || !responseBody.success) {
            errors.push({ id: networkLookupId, status: rawResponse.status() });
            continue;
          }
          const total = AberrationEntryMapper.mapData(responseBody.data).pagination.total;
          if (total > 0) {
            withDataNetworks.push({ id: networkLookupId, total });
          } else {
            emptyNetworks.push(networkLookupId);
          }
        }

        console.log(
          `[${baseline.label}] orgBaseline=${orgTotal} networks=${networkIds.length} withData=${withDataNetworks.length} empty=${emptyNetworks.length} errors=${errors.length}`,
        );
        console.log(`[${baseline.label}] networkIdsWithData=${JSON.stringify(withDataNetworks)}`);

        const fs = await import("fs");
        const path = await import("path");
        const reportDir = path.join(process.cwd(), "reports", "revenue-protection");
        fs.mkdirSync(reportDir, { recursive: true });
        const reportPath = path.join(
          reportDir,
          `aberration-entry-${baseline.label}-networks-with-data.json`,
        );
        fs.writeFileSync(
          reportPath,
          JSON.stringify(
            {
              entryType: baseline.label,
              month: baseline.query.month,
              year: baseline.query.year,
              orgBaselineTotal: orgTotal,
              networksScanned: networkIds.length,
              withDataCount: withDataNetworks.length,
              emptyCount: emptyNetworks.length,
              errorCount: errors.length,
              networkIdsWithData: withDataNetworks,
              sampleEmptyNetworkIds: emptyNetworks.slice(0, 50),
            },
            null,
            2,
          ),
          "utf8",
        );
        console.log(`[${baseline.label}] wrote ${reportPath}`);

        expect(
          errors,
          `${baseline.label} network HTTP/API errors: ${JSON.stringify(errors.slice(0, 20))}`,
        ).toEqual([]);

        // Org has data → every network must have data (empty network = hard fail)
        if (orgTotal > 0) {
          expect(
            emptyNetworks,
            `${baseline.label}: org has ${orgTotal} rows but ${emptyNetworks.length}/${networkIds.length} networks returned total=0. Networks WITH data: ${JSON.stringify(withDataNetworks)}. Sample empty ids: ${emptyNetworks.slice(0, 30).join(", ")}`,
          ).toEqual([]);
          expect(
            withDataNetworks.length,
            `${baseline.label}: org has ${orgTotal} rows but zero networks returned data`,
          ).toBeGreaterThan(0);
        }

        // Vice versa: org empty → no network may have data (network-only data = hard fail)
        if (orgTotal === 0) {
          expect(
            withDataNetworks,
            `${baseline.label}: org total=0 but ${withDataNetworks.length} networks have data: ${JSON.stringify(withDataNetworks)}`,
          ).toEqual([]);
        }
      },
    );
  }
});
