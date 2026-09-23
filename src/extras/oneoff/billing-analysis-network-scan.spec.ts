/**
 * One-off scan — skipped unless ONEOFF_NETWORK_SCAN=1.
 *
 * Command (PowerShell):
 *   $env:ONEOFF_NETWORK_SCAN='1'; npx playwright test src/extras/oneoff/billing-analysis-network-scan.spec.ts --workers=1
 */
import fs from "fs";
import path from "path";
import { expect } from "@playwright/test";
import { test } from "../../fixtures/api.fixture";

test.skip(process.env.ONEOFF_NETWORK_SCAN !== "1", "Set ONEOFF_NETWORK_SCAN=1 to run this scan");

const FROM_ID = 1409;
const TO_ID = 2490;
const CONCURRENCY = 4;
const PATH = "/revenue-protection/billing-analysis";
const FILTERS = {
  scopeType: "network",
  fromDate: "2020-06-01",
  toDate: "2020-06-30",
  page: "1",
  limit: "10",
  sortOrder: "desc",
} as const;

function queryFor(id: number): string {
  const params = new URLSearchParams({
    scopeType: FILTERS.scopeType,
    networkLookupId: String(id),
    fromDate: FILTERS.fromDate,
    toDate: FILTERS.toDate,
    page: FILTERS.page,
    limit: FILTERS.limit,
    sortOrder: FILTERS.sortOrder,
  });
  return `${PATH}?${params.toString()}`;
}

function unwrap(json: unknown): Record<string, unknown> {
  if (json && typeof json === "object" && "data" in json) {
    const data = (json as { data?: unknown }).data;
    if (data && typeof data === "object") {
      return data as Record<string, unknown>;
    }
  }
  return (json && typeof json === "object" ? json : {}) as Record<string, unknown>;
}

function totalOf(data: Record<string, unknown>): number {
  if (typeof data.total === "number") {
    return data.total;
  }
  const pagination = data.pagination as { total?: number } | undefined;
  if (pagination && typeof pagination.total === "number") {
    return pagination.total;
  }
  return 0;
}

function itemCountOf(data: Record<string, unknown>): number {
  const items = data.items ?? data.rows;
  return Array.isArray(items) ? items.length : 0;
}

test("one-off scan billing-analysis networkLookupId 1409-2490", async ({ authenticatedApi }) => {
  test.setTimeout(20 * 60_000);

  const withData: Array<{ id: number; total: number; itemCount: number }> = [];
  const errors: Array<{ id: number; status: number; code: string }> = [];
  let empty = 0;
  let completed = 0;
  let nextId = FROM_ID;

  const scanOne = async (id: number): Promise<void> => {
    try {
      const res = await authenticatedApi.get(queryFor(id), { timeout: 60_000 });
      const json = (await res.json().catch(() => ({}))) as {
        error?: { code?: string; message?: string };
      };
      const data = unwrap(json);
      const total = totalOf(data);
      const itemCount = itemCountOf(data);
      if (res.status() >= 400) {
        errors.push({
          id,
          status: res.status(),
          code: String(json.error?.code ?? json.error?.message ?? ""),
        });
      } else if (total > 0 || itemCount > 0) {
        withData.push({ id, total, itemCount });
      } else {
        empty += 1;
      }
    } catch (err) {
      errors.push({
        id,
        status: 0,
        code: err instanceof Error ? err.message.slice(0, 120) : String(err),
      });
    }
    completed += 1;
    if (completed % 100 === 0 || completed === TO_ID - FROM_ID + 1) {
      console.log(
        `Progress ${completed}/${TO_ID - FROM_ID + 1} | with data ${withData.length} | empty ${empty} | errors ${errors.length}`,
      );
    }
  };

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (true) {
        const id = nextId;
        nextId += 1;
        if (id > TO_ID) {
          return;
        }
        await scanOne(id);
      }
    }),
  );

  withData.sort((a, b) => a.id - b.id);
  errors.sort((a, b) => a.id - b.id);

  const outPath = path.join(process.cwd(), "reports", "billing-analysis-network-scan-2020-06.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        range: { fromId: FROM_ID, toId: TO_ID, scanned: TO_ID - FROM_ID + 1 },
        withData,
        withDataIds: withData.map((row) => row.id),
        emptyCount: empty,
        errors,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`OUT_FILE=${outPath}`);
  console.log(`WITH_DATA_IDS=${withData.map((row) => row.id).join(",")}`);
  expect(fs.existsSync(outPath)).toBeTruthy();
});
