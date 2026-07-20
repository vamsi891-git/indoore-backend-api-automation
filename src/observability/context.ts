/**
 * Ambient per-test observability context.
 *
 * Layers that cannot easily receive an explicit context param (HTTP retry in
 * TimedApiClient, DB-pool retry in postgres.client) read the "current" context
 * that the observability fixture sets at the start of each test and clears in
 * teardown. Playwright runs tests sequentially within a worker process, so a
 * module-level value is safe for this purpose.
 *
 * When no context is set (i.e. a module that hasn't opted in yet), consumers
 * simply skip emitting — keeping observability opt-in per module.
 */

export interface ObsContext {
  runId: string;
  testId: string;
  module: string;
}

let current: ObsContext | undefined;

export function setCurrentContext(ctx: ObsContext | undefined): void {
  current = ctx;
}

export function getCurrentContext(): ObsContext | undefined {
  return current;
}

export function clearCurrentContext(): void {
  current = undefined;
}
