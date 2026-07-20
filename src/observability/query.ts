/**
 * Trace reconstruction CLI.
 *
 * Reads observability-logs/<runId>.jsonl and prints the reconstructed trace of
 * a run (optionally a single test) in canonical order:
 *   CI routing -> contract checks -> DB checks -> retries -> final outcome
 *
 * Usage:
 *   ts-node --compilerOptions '{"module":"commonjs"}' src/observability/query.ts <runId> [--test "<testId>"]
 *   ts-node ... src/observability/query.ts --latest
 *   ts-node ... src/observability/query.ts --run <runId> --json
 */

import {
  KIND_ORDER,
  type ContractEvent,
  type CiRoutingEvent,
  type DbCrossValidationEvent,
  type ObservabilityEvent,
  type RetryEvent,
  type TestOutcomeEvent,
} from "./types";
import { readEvents, readPersistedRunId } from "./logger";

interface Args {
  runId?: string;
  testId?: string;
  latest: boolean;
  json: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { latest: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--test" || token === "-t") {
      args.testId = argv[++i];
    } else if (token === "--run" || token === "-r") {
      args.runId = argv[++i];
    } else if (token === "--latest" || token === "-l") {
      args.latest = true;
    } else if (token === "--json") {
      args.json = true;
    } else if (!token.startsWith("-") && !args.runId) {
      args.runId = token;
    }
  }
  return args;
}

function outcomeBadge(outcome: string): string {
  switch (outcome) {
    case "pass":
      return "PASS";
    case "fail":
      return "FAIL";
    case "warn":
      return "WARN";
    default:
      return outcome.toUpperCase();
  }
}

function short(value: unknown): string {
  if (value === undefined) {
    return "-";
  }
  if (value === null) {
    return "null";
  }
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

function sortEvents(events: ObservabilityEvent[]): ObservabilityEvent[] {
  return [...events].sort((a, b) => {
    const kindDelta = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    if (kindDelta !== 0) {
      return kindDelta;
    }
    return a.timestamp.localeCompare(b.timestamp);
  });
}

function renderCi(event: CiRoutingEvent): string[] {
  const lines = [
    `  CI ROUTING [${outcomeBadge(event.outcome)}] ${event.trigger} -> ${event.runType}`,
  ];
  if (event.matchedRule) lines.push(`    rule    : ${event.matchedRule}`);
  if (event.modules?.length) lines.push(`    modules : ${event.modules.join(", ")}`);
  if (event.branch || event.sha) {
    lines.push(`    ref     : ${event.branch ?? "-"} @ ${event.sha?.slice(0, 8) ?? "-"}`);
  }
  if (event.workflow) lines.push(`    workflow: ${event.workflow}`);
  if (event.runUrl) lines.push(`    run     : ${event.runUrl}`);
  return lines;
}

function renderContract(event: ContractEvent): string {
  const parts = [`  CONTRACT  [${outcomeBadge(event.outcome)}] ${event.check}`];
  if (event.field) parts.push(`field=${event.field}`);
  if (event.expected !== undefined || event.actual !== undefined) {
    parts.push(`expected=${short(event.expected)} actual=${short(event.actual)}`);
  }
  if (event.outcome !== "pass" && event.message) parts.push(`- ${event.message}`);
  return parts.join(" ");
}

function renderDb(event: DbCrossValidationEvent): string {
  const target = [event.table, event.column].filter(Boolean).join(".") || event.label || "";
  const parts = [`  DB CHECK  [${outcomeBadge(event.outcome)}] ${target}`];
  if (event.label && target !== event.label) parts.push(`(${event.label})`);
  parts.push(`api=${short(event.actual)} db=${short(event.expected)}`);
  if (event.mode) parts.push(`mode=${event.mode}`);
  if (event.outcome !== "pass" && event.message) parts.push(`- ${event.message}`);
  return parts.join(" ");
}

function renderRetry(event: RetryEvent): string {
  const max = event.maxAttempts ? `/${event.maxAttempts}` : "";
  const status = event.succeeded ? "succeeded" : "failed";
  const target = event.target ? ` ${event.target}` : "";
  return `  RETRY     [${outcomeBadge(event.outcome)}] ${event.layer} attempt ${event.attempt}${max} ${status} — ${event.reason}${target}`;
}

function renderOutcome(event: TestOutcomeEvent): string {
  const parts = [
    `  OUTCOME   [${outcomeBadge(event.outcome)}] ${event.status} in ${event.durationMs}ms`,
  ];
  if (event.tags?.length) parts.push(`tags=${event.tags.join(",")}`);
  if (event.error) parts.push(`\n            error: ${event.error.split("\n")[0]}`);
  return parts.join(" ");
}

function renderEvent(event: ObservabilityEvent): string[] {
  switch (event.kind) {
    case "ci_routing":
      return renderCi(event);
    case "contract":
      return [renderContract(event)];
    case "db_cross_validation":
      return [renderDb(event)];
    case "retry":
      return [renderRetry(event)];
    case "test_outcome":
      return [renderOutcome(event)];
    default:
      return [`  ${JSON.stringify(event)}`];
  }
}

function groupByTest(events: ObservabilityEvent[]): Map<string, ObservabilityEvent[]> {
  const groups = new Map<string, ObservabilityEvent[]>();
  for (const event of events) {
    // Run-level CI routing (no specific test) is grouped under "<run>".
    const key = event.kind === "ci_routing" && !event.testId ? "<run>" : event.testId || "<unknown>";
    const bucket = groups.get(key) ?? [];
    bucket.push(event);
    groups.set(key, bucket);
  }
  return groups;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const runId = args.runId ?? (args.latest ? readPersistedRunId() : undefined);

  if (!runId) {
    console.error(
      "Usage: query <runId> [--test \"<testId>\"] [--json]\n" +
        "   or: query --latest   (uses the most recently persisted runId)",
    );
    process.exitCode = 2;
    return;
  }

  let events = readEvents(runId);
  if (args.testId) {
    events = events.filter(
      (e) => e.testId === args.testId || (e.kind === "ci_routing" && !e.testId),
    );
  }

  if (events.length === 0) {
    console.error(`No events found for runId=${runId}${args.testId ? ` testId=${args.testId}` : ""}`);
    process.exitCode = 1;
    return;
  }

  if (args.json) {
    console.log(JSON.stringify(sortEvents(events), null, 2));
    return;
  }

  console.log(`\nTrace for run ${runId}`);
  console.log("=".repeat(60));

  const groups = groupByTest(events);
  // Show run-level events first, then each test.
  const orderedKeys = [...groups.keys()].sort((a, b) => {
    if (a === "<run>") return -1;
    if (b === "<run>") return 1;
    return a.localeCompare(b);
  });

  for (const key of orderedKeys) {
    const group = sortEvents(groups.get(key) ?? []);
    console.log(`\n${key === "<run>" ? "RUN-LEVEL" : `TEST: ${key}`}`);
    console.log("-".repeat(60));
    for (const event of group) {
      for (const line of renderEvent(event)) {
        console.log(line);
      }
    }
  }
  console.log("");
}

main();
