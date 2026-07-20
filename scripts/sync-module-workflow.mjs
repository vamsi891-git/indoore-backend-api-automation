/**
 * Keep Playwright Module Tests workflow dropdown in sync with discovered modules.
 *
 * Usage:
 *   node scripts/sync-module-workflow.mjs          # rewrite options in-place
 *   node scripts/sync-module-workflow.mjs --check  # exit 1 if YAML is stale
 */
import fs from "fs";
import path from "path";
import { discoverModules } from "./lib/modules.mjs";

const ROOT = process.cwd();
const WORKFLOW_PATH = path.join(
  ROOT,
  ".github",
  "workflows",
  "playwright-module.yml",
);

const BEGIN = "# BEGIN-AUTO-MODULE-OPTIONS";
const END = "# END-AUTO-MODULE-OPTIONS";

function buildOptionsBlock(slugs) {
  const lines = [
    `        ${BEGIN}`,
    "        options:",
    ...slugs.map((slug) => `          - ${slug}`),
    `        ${END}`,
  ];
  return lines.join("\n");
}

function extractOptionsBlock(yamlText) {
  const beginIdx = yamlText.indexOf(BEGIN);
  const endIdx = yamlText.indexOf(END);
  if (beginIdx === -1 || endIdx === -1 || endIdx < beginIdx) {
    return null;
  }
  return yamlText.slice(beginIdx, endIdx + END.length);
}

function parseSlugsFromBlock(block) {
  return block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const modules = discoverModules();
  const expectedSlugs = modules.map((m) => m.slug);

  if (!fs.existsSync(WORKFLOW_PATH)) {
    console.error(`Missing workflow: ${WORKFLOW_PATH}`);
    process.exit(1);
  }

  const yamlText = fs.readFileSync(WORKFLOW_PATH, "utf8");
  const currentBlock = extractOptionsBlock(yamlText);

  if (!currentBlock) {
    console.error(
      `Missing markers ${BEGIN} / ${END} in ${path.relative(ROOT, WORKFLOW_PATH)}`,
    );
    console.error(
      "Add them under workflow_dispatch.inputs.module, then re-run this script.",
    );
    process.exit(1);
  }

  const actualSlugs = parseSlugsFromBlock(currentBlock);
  const missing = expectedSlugs.filter((s) => !actualSlugs.includes(s));
  const extra = actualSlugs.filter((s) => !expectedSlugs.includes(s));
  const orderMismatch =
    actualSlugs.length === expectedSlugs.length &&
    actualSlugs.some((slug, i) => slug !== expectedSlugs[i]);

  if (missing.length === 0 && extra.length === 0 && !orderMismatch) {
    console.log(
      `Module workflow options are in sync (${expectedSlugs.length} modules).`,
    );
    process.exit(0);
  }

  if (checkOnly) {
    console.error("Module workflow options are OUT OF SYNC with src/modules:");
    if (missing.length) console.error(`  missing: ${missing.join(", ")}`);
    if (extra.length) console.error(`  extra:   ${extra.join(", ")}`);
    if (orderMismatch) console.error("  order differs from discoverModules()");
    console.error("Fix with: node scripts/sync-module-workflow.mjs");
    process.exit(1);
  }

  const nextBlock = buildOptionsBlock(expectedSlugs);
  const nextYaml = yamlText.replace(currentBlock, nextBlock);
  fs.writeFileSync(WORKFLOW_PATH, nextYaml, "utf8");
  console.log(
    `Updated ${path.relative(ROOT, WORKFLOW_PATH)} with ${expectedSlugs.length} module options.`,
  );
  if (missing.length) console.log(`  added:   ${missing.join(", ")}`);
  if (extra.length) console.log(`  removed: ${extra.join(", ")}`);
}

main();
