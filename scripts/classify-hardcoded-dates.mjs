/**
 * Classify hardcoded-date inventory for Phase 5 replace review.
 * Does not modify files.
 *
 *   node scripts/classify-hardcoded-dates.mjs
 */
import fs from "node:fs";
import path from "node:path";

const inventoryPath = path.resolve("reports/hardcoded-dates-inventory.txt");
if (!fs.existsSync(inventoryPath)) {
  console.error("Run: node scripts/list-hardcoded-dates.mjs > reports/hardcoded-dates-inventory.txt");
  process.exit(1);
}

/** @type {{ replace: string[], keep: string[], review: string[] }} */
const buckets = { replace: [], keep: [], review: [] };

const text = fs.readFileSync(inventoryPath, "utf8");
const fileBlocks = text.split(/\n(?=src\/modules\/)/).filter((b) => b.startsWith("src/"));

for (const block of fileBlocks) {
  const first = block.split("\n")[0] ?? "";
  const file = first.replace(/\s*\(.*/, "").trim();
  const lower = block.toLowerCase();

  const isSentinel = /2099-01-01/.test(block) && !/2025-|2024-|2026-0[1-9]|2026-1[0-2]/.test(
    block.replace(/2099-01-01/g, ""),
  );
  const isContractOnly =
    /contract_|saved example|fixture|sample shape|meterTimestamp|lastReadingIso|createdAt|updatedAt|serviceDate|mdKwOt|mdKvaOt|entryDateTime|billingPeriod|nextCursor|logDate:/.test(
      lower,
    ) && !/\bdate:\s*"20|\bfromDate|\btoDate|\bfrom:|\bto:|defaultFrom|defaultTo|DefaultDate|reportFrom|reportTo|consumptionReport/.test(
      block,
    );
  const isQueryWindow =
    /\bdate:\s*"20|fromDate|toDate|DefaultFrom|DefaultTo|DefaultDate|consumptionReportFrom|consumptionReportTo|lastNDays|from:\s*"20|to:\s*"20/.test(
      block,
    ) || /alarms-events.*\.data\.ts.*2025-08-23|2025-10-01|2025-12-19|priority-overview|mis-dashboard.*fromDate/.test(block);

  const isErrorMessage = /billing_period_not_ready|missing 20/.test(lower);

  if (isErrorMessage || isSentinel) {
    buckets.keep.push(`${file} — sentinel / error-message dates`);
  } else if (isQueryWindow) {
    buckets.replace.push(`${file} — live query window (prefer relative dates)`);
  } else if (isContractOnly) {
    buckets.keep.push(`${file} — contract/fixture timestamps`);
  } else {
    buckets.review.push(`${file} — mixed; review lines`);
  }
}

console.log("=== REPLACE (live query windows) ===");
for (const line of buckets.replace) console.log("  " + line);
console.log("\n=== KEEP (fixtures / sentinels / messages) ===");
for (const line of buckets.keep) console.log("  " + line);
console.log("\n=== REVIEW ===");
for (const line of buckets.review) console.log("  " + line);
console.log(
  `\nTotals: replace=${buckets.replace.length} keep=${buckets.keep.length} review=${buckets.review.length}`,
);
console.log("No files modified. Say \"replace dates\" to apply helpers to REPLACE set.");
