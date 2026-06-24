/**
 * Run all tests (or smoke only) for one module folder.
 *
 * Usage:
 *   node scripts/run-module-tests.mjs <module-slug> [--smoke]
 *   npm run test:module -- energy-audits
 *   npm run test:module -- energy-audits --smoke
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

if (!slug || slug === "list") {
  console.log(listModulesText());
  process.exit(slug ? 0 : 1);
}

const module = getModuleBySlug(slug);
if (!module) {
  console.error(`Unknown module slug: "${slug}"\n`);
  console.error(listModulesText());
  process.exit(1);
}

const playwrightArgs = ["playwright", "test", module.testPath, "--workers=1"];
if (smoke) {
  playwrightArgs.push("--grep", "@smoke");
}

const scopeLabel = smoke ? "smoke" : "all";
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
