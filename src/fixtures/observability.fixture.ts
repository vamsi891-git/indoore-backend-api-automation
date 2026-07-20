import { test as apiDbTest } from "./api-db.fixture";
import { appendEvent, resolveRunId } from "../observability/logger";
import {
  clearCurrentContext,
  setCurrentContext,
  type ObsContext,
} from "../observability/context";
import type { TestOutcomeEvent } from "../observability/types";

function moduleFromFile(file: string): string {
  const match = file.replace(/\\/g, "/").match(/modules\/([^/]+)\//);
  return match ? match[1] : "unknown";
}

function outcomeFor(status: string | undefined): TestOutcomeEvent["outcome"] {
  if (status === "passed") {
    return "pass";
  }
  if (status === "skipped") {
    return "warn";
  }
  return "fail";
}

type ObsFixtures = {
  /** Per-test observability context: { runId, testId, module }. */
  obs: ObsContext;
};

/**
 * Observability-enabled test: everything api-db.fixture provides
 * (authenticatedApi, db, archiveDb) plus an `obs` context threaded to every
 * layer. Sets an ambient context so retry layers can emit, and writes a
 * TestOutcomeEvent on teardown. Opt-in per module by importing `test` here.
 */
export const test = apiDbTest.extend<ObsFixtures>({
  obs: async ({}, use, testInfo) => {
    const ctx: ObsContext = {
      runId: resolveRunId(),
      testId: testInfo.title,
      module: moduleFromFile(testInfo.file),
    };
    setCurrentContext(ctx);
    const start = Date.now();
    try {
      await use(ctx);
    } finally {
      const status = testInfo.status ?? "passed";
      const errorMessage = testInfo.errors?.[0]?.message;
      appendEvent({
        kind: "test_outcome",
        runId: ctx.runId,
        testId: ctx.testId,
        module: ctx.module,
        outcome: outcomeFor(status),
        durationMs: Date.now() - start,
        status: status as TestOutcomeEvent["status"],
        error: errorMessage,
        title: testInfo.title,
        tags: testInfo.tags,
      });
      clearCurrentContext();
    }
  },
});

export { expect } from "./base.fixture";
