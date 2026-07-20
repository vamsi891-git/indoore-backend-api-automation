#!/usr/bin/env node
/**
 * Emit a run-level CiRoutingEvent before the test run starts.
 *
 * Reads GITHUB_* env vars plus routing hints provided by the caller
 * (OBS_RUN_TYPE, OBS_MODULES, OBS_ROUTING_REASON — typically wired from the
 * detect-changed-modules outputs). Generates/persists a runId so the following
 * `playwright test` step reuses the same run file, and exports OBS_RUN_ID to
 * GITHUB_ENV so downstream steps inherit it.
 *
 * Best-effort: never fails the job (always exits 0).
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "observability-logs");
const RUN_ID_FILE = path.join(LOG_DIR, ".run-id");

function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function resolveRunId() {
  const fromEnv = (process.env.OBS_RUN_ID || "").trim();
  if (fromEnv) return fromEnv;
  return crypto.randomUUID();
}

function csv(value) {
  return (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function resolveRunType(modules) {
  const explicit = (process.env.OBS_RUN_TYPE || "").trim();
  if (explicit === "targeted" || explicit === "full-regression") {
    return explicit;
  }
  const workflow = process.env.GITHUB_WORKFLOW || "";
  if (/module gate/i.test(workflow)) return "targeted";
  if ((process.env.GITHUB_EVENT_NAME || "") === "push" && !modules.length) {
    return "full-regression";
  }
  return modules.length ? "targeted" : "unknown";
}

function runUrl() {
  const server = process.env.GITHUB_SERVER_URL;
  const repo = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  if (server && repo && runId) {
    return `${server}/${repo}/actions/runs/${runId}`;
  }
  return undefined;
}

function main() {
  try {
    ensureDir();
    const runId = resolveRunId();
    fs.writeFileSync(RUN_ID_FILE, runId, "utf8");

    const modules = csv(process.env.OBS_MODULES);
    const runType = resolveRunType(modules);

    const event = {
      kind: "ci_routing",
      runId,
      testId: "",
      module:
        modules.length === 1
          ? modules[0]
          : runType === "full-regression"
            ? "ALL"
            : modules.length
              ? "multiple"
              : "ci",
      timestamp: new Date().toISOString(),
      outcome: "pass",
      trigger: process.env.GITHUB_EVENT_NAME || "local",
      runType,
      matchedRule: (process.env.OBS_ROUTING_REASON || "").trim() || undefined,
      modules: modules.length ? modules : undefined,
      branch: process.env.GITHUB_REF_NAME || undefined,
      sha: process.env.GITHUB_SHA || undefined,
      workflow: process.env.GITHUB_WORKFLOW || undefined,
      runUrl: runUrl(),
    };

    fs.appendFileSync(
      path.join(LOG_DIR, `${runId}.jsonl`),
      `${JSON.stringify(event)}\n`,
      "utf8",
    );

    // Export runId so the test step (and global setup) reuse this run.
    if (process.env.GITHUB_ENV) {
      fs.appendFileSync(process.env.GITHUB_ENV, `OBS_RUN_ID=${runId}\n`, "utf8");
    }
    console.log(`[observability] CiRoutingEvent written (runId=${runId}, runType=${runType}).`);
  } catch (error) {
    console.warn(
      "[observability] CI routing event failed (non-fatal):",
      error instanceof Error ? error.message : error,
    );
  }
}

main();
