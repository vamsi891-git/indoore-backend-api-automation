/**
 * Run @contract-snapshot specs for one or more modules.
 *
 * Usage:
 *   node scripts/run-contract-tests.mjs consumers
 *   node scripts/run-contract-tests.mjs asset-management
 */
import { spawnSync } from "child_process";

const requested = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const targets =
  requested.length > 0
    ? requested
    : [
        "revenue-protection",
        "utils-lookup",
        "asset-management",
        "consumers",
        "technical-analysis",
        "feeder",
        "dashboard",
        "meter-replacement",
      ];

const pathBySlug = {
  "revenue-protection": "src/modules/REVENUE-PROTECTION/tests",
  "utils-lookup": "src/modules/UTILS-LOOKUP/tests",
  "asset-management": "src/modules/ASSET-MANAGEMENT/tests",
  consumers: "src/modules/CONSUMERS/tests",
  "technical-analysis": "src/modules/TECHNICAL-ANALYSIS/tests",
  feeder: "src/modules/FEEDER/tests",
  dashboard: "src/modules/DASHBOARD/tests",
  "meter-replacement": "src/modules/METER-REPLACEMENT/tests",
};

const testPaths = targets.map((slug) => {
  const path = pathBySlug[slug];
  if (!path) {
    console.error(`Unknown contract module: ${slug}`);
    process.exit(1);
  }
  return path;
});

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  [
    "playwright",
    "test",
    ...testPaths,
    "--grep",
    "@contract-snapshot",
    "--workers=1",
  ],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
