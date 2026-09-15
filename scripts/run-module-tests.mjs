/**
 * Run tests for one module folder. Always 1 worker (easier to debug).
 *
 *   npm run test:module -- master-data
 *   npm run test:module -- master-data --smoke
 *   npm run test:module -- master-data --api
 *   npm run test:module -- master-data --db
 *
 * Default is API-only (skips @db). Use --db or npm run test:<slug>:db for SQL checks.
 * Mutation-proof tests stay off unless INCLUDE_MUTATION_PROOF=true
 * or you run npm run test:<slug>:mutation-proof
 */
import { spawnSync } from "child_process";
import {
  getModuleBySlug,
  listModulesText,
} from "./lib/modules.mjs";

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const slug = args.find((arg) => !arg.startsWith("--"));
const smoke = args.includes("--smoke");
const apiOnly = args.includes("--api");
const dbOnly = args.includes("--db");

if (!slug || slug === "list") {
  console.log(listModulesText());
  process.exit(slug ? 0 : 1);
}

const scopeFlags = [smoke, apiOnly, dbOnly].filter(Boolean).length;
if (scopeFlags > 1) {
  console.error("Use only one of --smoke, --api, or --db");
  process.exit(1);
}

const module = getModuleBySlug(slug);
if (!module) {
  console.error(`Unknown module slug: "${slug}"\n`);
  console.error(listModulesText());
  process.exit(1);
}

const playwrightArgs = ["playwright", "test", module.testPath, "--workers=1"];
let scopeLabel = "api";
const wantMutationProof =
  process.env.INCLUDE_MUTATION_PROOF?.trim().toLowerCase() === "true";

if (smoke) {
  playwrightArgs.push("--grep", "@smoke");
  scopeLabel = "smoke";
} else if (dbOnly) {
  playwrightArgs.push("--grep", "@db");
  scopeLabel = "db";
} else {
  // Default (and --api): GET/list specs only. Archive DB checks are `npm run test:<slug>:db`.
  playwrightArgs.push("--grep-invert", "@db");
  scopeLabel = "api";
}

const env = { ...process.env };
if (wantMutationProof) {
  env.INCLUDE_MUTATION_PROOF = "true";
}

console.log(
  `Running ${scopeLabel} tests for ${module.moduleName} (${module.testPath})`,
);

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  playwrightArgs,
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env,
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
