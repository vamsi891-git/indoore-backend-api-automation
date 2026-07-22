/**
 * Manual break-and-recover for one contract snapshot.
 * Usage:
 *   node scripts/contract-break-recover.mjs <snapshotRelPath> <specRelPath> mutate
 *   node scripts/contract-break-recover.mjs <snapshotRelPath> <specRelPath> restore
 *   node scripts/contract-break-recover.mjs <snapshotRelPath> <specRelPath> run
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

const [snapshotRel, specRel, mode] = process.argv.slice(2);
if (!snapshotRel || !specRel || !["mutate", "restore", "run"].includes(mode)) {
  console.error(
    "Usage: node scripts/contract-break-recover.mjs <snapshot> <spec> mutate|restore|run",
  );
  process.exit(1);
}

const snapPath = path.resolve(snapshotRel);
const raw = fs.readFileSync(snapPath, "utf8");
const json = JSON.parse(raw);

if (mode === "mutate") {
  if (Array.isArray(json.columns) && json.columns[0]) {
    const before = json.columns[0].header;
    json.columns[0].header = `MUTATED-${before}`;
    console.log(`Mutated columns[0].header: ${before} -> ${json.columns[0].header}`);
  } else if (Array.isArray(json.dataKeys)) {
    json.dataKeys = ["MUTATED-ivrsNo"];
    console.log(`Mutated dataKeys -> ${JSON.stringify(json.dataKeys)}`);
  } else {
    console.error("Unknown snapshot shape");
    process.exit(1);
  }
  fs.writeFileSync(snapPath, `${JSON.stringify(json, null, 2)}\n`);
  process.exit(0);
}

if (mode === "restore") {
  if (Array.isArray(json.columns) && json.columns[0]) {
    json.columns[0].header = String(json.columns[0].header).replace(
      /^MUTATED-/,
      "",
    );
    console.log(`Restored columns[0].header: ${json.columns[0].header}`);
  } else if (Array.isArray(json.dataKeys)) {
    json.dataKeys = ["ivrsNo"];
    console.log(`Restored dataKeys -> ${JSON.stringify(json.dataKeys)}`);
  }
  fs.writeFileSync(snapPath, `${JSON.stringify(json, null, 2)}\n`);
  process.exit(0);
}

process.env.UPDATE_CONTRACT_SNAPSHOTS = "false";
const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["playwright", "test", specRel, "--workers=1", "--retries=0"],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  },
);
process.exit(result.status ?? 1);
