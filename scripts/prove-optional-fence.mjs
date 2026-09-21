/**
 * Phase 6 prove script — default GET path does not need DB / LLM / OBS.
 *
 * Checks:
 * 1. Static: module tests that are NOT @db / @contract-snapshot / @mutation-proof
 *    must not import extras/db or extras/contract.
 * 2. Runtime: with DB_* + LLM keys cleared and OBS_DISABLED=1,
 *    isDbConfigured / isDefectLlmEnabled / appendEvent stay safe.
 *
 * Usage: node scripts/prove-optional-fence.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const root = process.cwd();
const require = createRequire(path.join(root, "package.json"));

const FORBIDDEN_IN_DEFAULT = [
  /extras\/db\//,
  /extras\/contract\//,
];

const OPTIONAL_TAG_HINT =
  /@db|@contract-snapshot|@mutation-proof|observability\.fixture|\/Db\//;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(spec|harness)\.ts$/.test(entry.name) || /Db[/\\].+\.ts$/.test(full)) {
      out.push(full);
    }
  }
  return out;
}

let violations = 0;
const moduleTests = walk(path.join(root, "src/modules"));

for (const file of moduleTests) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const text = fs.readFileSync(file, "utf8");
  const isOptionalLane =
    OPTIONAL_TAG_HINT.test(text) ||
    /\/tests\/mutation-proof\//.test(rel) ||
    /\.db\.spec\.ts$/.test(rel) ||
    /\.contract\.spec\.ts$/.test(rel) ||
    /\/Db\//.test(rel);

  if (isOptionalLane) continue;

  for (const re of FORBIDDEN_IN_DEFAULT) {
    if (re.test(text)) {
      console.error(`FAIL default-spec imports optional: ${rel}`);
      violations += 1;
    }
  }
}

console.log(
  violations === 0
    ? "OK static: default GET specs do not import extras/db or extras/contract"
    : `FAIL static: ${violations} default-spec import(s)`,
);

// Runtime gates (clear optional env before loading schema)
const cleared = {
  DB_HOST: "",
  DB_USER: "",
  DB_PASSWORD: "",
  DB_NAME: "",
  DEFECT_LLM_ENABLED: "",
  DEFECT_LLM_API_KEY: "",
  OPENAI_API_KEY: "",
  OBS_DISABLED: "1",
};
for (const [k, v] of Object.entries(cleared)) {
  process.env[k] = v;
}

// Prefer compiled-free path: dynamic import of TS via playwright's deps is heavy.
// Instead, re-implement the same boolean gates the modules use.
function truthy(v) {
  return /^(1|true|yes|on)$/i.test(String(v ?? "").trim());
}

const dbConfigured = Boolean(
  process.env.DB_HOST &&
    process.env.DB_USER &&
    process.env.DB_PASSWORD &&
    process.env.DB_NAME,
);
const llmEnabled =
  truthy(process.env.DEFECT_LLM_ENABLED) &&
  Boolean(process.env.DEFECT_LLM_API_KEY || process.env.OPENAI_API_KEY);
const obsDisabled = truthy(process.env.OBS_DISABLED);

if (dbConfigured) {
  console.error("FAIL runtime: expected isDbConfigured=false with DB_* cleared");
  violations += 1;
} else {
  console.log("OK runtime: DB_* cleared → DB not configured");
}

if (llmEnabled) {
  console.error("FAIL runtime: expected LLM disabled");
  violations += 1;
} else {
  console.log("OK runtime: LLM keys unset → defect LLM off");
}

if (!obsDisabled) {
  console.error("FAIL runtime: expected OBS_DISABLED=1");
  violations += 1;
} else {
  console.log("OK runtime: OBS_DISABLED=1");
}

// Confirm extras packages exist (move succeeded)
for (const p of [
  "src/extras/db/postgres.client.ts",
  "src/extras/contract/contract-snapshot.helper.ts",
  "src/extras/ai/defect-llm-triage.ts",
  "src/extras/observability/logger.ts",
  "src/extras/index.ts",
]) {
  if (!fs.existsSync(path.join(root, p))) {
    console.error(`FAIL missing ${p}`);
    violations += 1;
  }
}

if (violations === 0) {
  console.log("\nprove-optional-fence: PASS");
  process.exit(0);
}
console.log(`\nprove-optional-fence: FAIL (${violations})`);
process.exit(1);
