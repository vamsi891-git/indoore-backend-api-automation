/**
 * Run @contract-snapshot specs for one or more modules.
 *
 * Usage:
 *   node scripts/run-contract-tests.mjs consumers
 *   node scripts/run-contract-tests.mjs asset-management
 */
import { spawnSync } from "child_process";

const requested = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const pathBySlug = {
  "revenue-protection": "src/modules/REVENUE-PROTECTION/tests",
  "utils-lookup": "src/modules/UTILS-LOOKUP/tests",
  "asset-management": "src/modules/ASSET-MANAGEMENT/tests",
  consumers: "src/modules/CONSUMERS/tests",
  "technical-analysis": "src/modules/TECHNICAL-ANALYSIS/tests",
  feeder: "src/modules/FEEDER/tests",
  dashboard: "src/modules/DASHBOARD/tests",
  "meter-replacement": "src/modules/METER-REPLACEMENT/tests",
  billing: "src/modules/BILLING/tests",
  "overall-dashboard": "src/modules/OVERALL-DASHBOARD/tests",
  notifications: "src/modules/NOTIFICATIONS/tests",
  "audit-logs": "src/modules/AUDIT-LOGS/tests",
  "modules-permissions": "src/modules/MODULES-PERMISSIONS/tests",
  "role-permissions": "src/modules/ROLE-PERMISSIONS/tests",
  "users-admin": "src/modules/USERS-ADMIN/tests",
  "users-profile-image": "src/modules/USERS-PROFILE-IMAGE/tests",
  reports: "src/modules/REPORTS/tests",
  consumption: "src/modules/CONSUMPTION/tests",
  dtrs: "src/modules/DTRS/tests",
  "energy-audits": "src/modules/ENERGY-AUDITS/tests",
  "commericial-analysis": "src/modules/COMMERICIAL-ANALYSIS/tests",
  auth: "src/modules/AUTH/tests",
  "master-data": "src/modules/MASTER-DATA/tests",
  "mis-dashboard": "src/modules/MIS-DASHBOARD/tests",
  "hes-commands": "src/modules/HES-COMMANDS/tests",
};

const targets =
  requested.length > 0 ? requested : Object.keys(pathBySlug);

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
