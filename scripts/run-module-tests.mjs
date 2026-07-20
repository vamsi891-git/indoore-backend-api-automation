/**
 * Run all tests (or a scoped subset) for one module folder.
 *
 * Usage:
 *   node scripts/run-module-tests.mjs <module-slug> [--smoke|--api|--db]
 *   npm run test:module -- revenue-protection
 *   npm run test:module -- revenue-protection --smoke
 *   npm run test:module -- revenue-protection --api
 *   npm run test:module -- revenue-protection --db
 */
import { spawnSync } from "child_process";
import {
  discoverModules,
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
let scopeLabel = "all";

if (smoke) {
  playwrightArgs.push("--grep", "@smoke");
  scopeLabel = "smoke";
} else if (apiOnly) {
  playwrightArgs.push("--grep-invert", "@db");
  scopeLabel = "api";
} else if (dbOnly) {
  playwrightArgs.push("--grep", "@db");
  scopeLabel = "db";
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
    env: process.env,
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
