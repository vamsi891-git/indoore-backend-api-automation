/**
 * Append-only JSONL logger for observability events.
 *
 * Design constraints:
 * - Best-effort: observability must NEVER break a test. Every write is guarded;
 *   failures are swallowed (optionally surfaced via OBS_DEBUG=1).
 * - One file per run: `observability-logs/<runId>.jsonl`, one JSON object/line.
 * - runId is generated once in global setup and persisted to a sidecar file so
 *   worker processes (which run separately from globalSetup) can read it.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { EventInput, ObservabilityEvent } from "./types";

const LOG_DIR_NAME = "observability-logs";
const RUN_ID_FILE = ".run-id";
const RUN_ID_ENV = "OBS_RUN_ID";

function isDisabled(): boolean {
  const flag = process.env.OBS_DISABLED?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

function isDebug(): boolean {
  const flag = process.env.OBS_DEBUG?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

function warn(context: string, error: unknown): void {
  if (isDebug()) {
    const message = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.warn(`[observability] ${context}: ${message}`);
  }
}

export function logDir(): string {
  return path.join(process.cwd(), LOG_DIR_NAME);
}

function ensureLogDir(): string {
  const dir = logDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function logFileFor(runId: string): string {
  return path.join(logDir(), `${sanitizeRunId(runId)}.jsonl`);
}

function sanitizeRunId(runId: string): string {
  // Keep filenames safe; runIds are UUIDs but guard against stray input.
  return runId.replace(/[^a-zA-Z0-9._-]/g, "_") || "unknown-run";
}

/** Generate a fresh run id. */
export function newRunId(): string {
  return crypto.randomUUID();
}

/**
 * Persist a runId so worker processes can pick it up. Writes both a sidecar
 * file (`observability-logs/.run-id`) and process.env for the current process.
 */
export function persistRunId(runId: string): void {
  try {
    const dir = ensureLogDir();
    fs.writeFileSync(path.join(dir, RUN_ID_FILE), runId, "utf8");
    process.env[RUN_ID_ENV] = runId;
  } catch (error) {
    warn("persistRunId", error);
  }
}

/** Read a previously persisted runId, if any. */
export function readPersistedRunId(): string | undefined {
  try {
    const fromEnv = process.env[RUN_ID_ENV]?.trim();
    if (fromEnv) {
      return fromEnv;
    }
    const file = path.join(logDir(), RUN_ID_FILE);
    if (fs.existsSync(file)) {
      const value = fs.readFileSync(file, "utf8").trim();
      return value || undefined;
    }
  } catch (error) {
    warn("readPersistedRunId", error);
  }
  return undefined;
}

/**
 * Initialize the run id for a fresh run (call once from global setup).
 * Honors a CI-provided OBS_RUN_ID, otherwise generates a new one. Always
 * (re)persists so each `npm test` invocation gets a distinct run file.
 */
export function initRunId(): string {
  const fromEnv = process.env[RUN_ID_ENV]?.trim();
  const runId = fromEnv || newRunId();
  persistRunId(runId);
  return runId;
}

/**
 * Resolve the active runId: env var → persisted sidecar → freshly generated
 * (and persisted). Safe to call from any process.
 */
export function resolveRunId(): string {
  const existing = readPersistedRunId();
  if (existing) {
    return existing;
  }
  const generated = newRunId();
  persistRunId(generated);
  return generated;
}

/**
 * Append one event to the run's JSONL log. Best-effort and never throws.
 */
export function appendEvent(event: EventInput): void {
  if (isDisabled()) {
    return;
  }
  try {
    if (!event.runId) {
      return;
    }
    const complete: ObservabilityEvent = {
      ...event,
      timestamp: event.timestamp ?? new Date().toISOString(),
    } as ObservabilityEvent;

    ensureLogDir();
    fs.appendFileSync(logFileFor(complete.runId), `${JSON.stringify(complete)}\n`, "utf8");
  } catch (error) {
    warn("appendEvent", error);
  }
}

/** Read and parse all events for a run (used by the query CLI and tests). */
export function readEvents(runId: string): ObservabilityEvent[] {
  const file = logFileFor(runId);
  if (!fs.existsSync(file)) {
    return [];
  }
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const events: ObservabilityEvent[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    try {
      events.push(JSON.parse(trimmed) as ObservabilityEvent);
    } catch (error) {
      warn("readEvents(parse)", error);
    }
  }
  return events;
}
