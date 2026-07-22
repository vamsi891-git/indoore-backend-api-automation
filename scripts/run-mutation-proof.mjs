/**
 * Run @mutation-proof specs for one or more modules.
 *
 * Usage:
 *   node scripts/run-mutation-proof.mjs
 *   node scripts/run-mutation-proof.mjs revenue-protection
 *   node scripts/run-mutation-proof.mjs utils-lookup
 */
import { spawnSync } from "child_process";

process.env.INCLUDE_MUTATION_PROOF = "true";

const requested = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const targets =
  requested.length > 0
    ? requested
    : ["revenue-protection", "utils-lookup"];

const pathBySlug = {
  "revenue-protection": "src/modules/REVENUE-PROTECTION/tests",
  "utils-lookup": "src/modules/UTILS-LOOKUP/tests",
};

const testPaths = targets.map((slug) => {
  const path = pathBySlug[slug];
  if (!path) {
    console.error(`Unknown mutation-proof module: ${slug}`);
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
    "@mutation-proof",
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
