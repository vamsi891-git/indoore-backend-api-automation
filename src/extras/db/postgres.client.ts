/**
 * OPTIONAL � fenced under src/extras/. Not required for default GET / @smoke.
 * Load only from @db / @contract-snapshot / @mutation-proof / observability fixtures,
 * or lazily from ValidationEngine on defect write. See src/extras/index.ts.
 */
import pg from "pg";
import { appendEvent } from "../observability/logger";
import { getCurrentContext } from "../observability/context";
import { env, isDbConfiguredFromEnv } from "../../core/config/env.schema";

export type DbConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
};

const TRANSIENT_DB_ERROR_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "53300", // too_many_connections
  "57P01", // admin_shutdown
  "57P03", // cannot_connect_now
  "08006", // connection_failure
  "08001", // sqlclient_unable_to_establish_sqlconnection
]);

/** Prisma P2028/P2024 equivalents for node-pg pool exhaustion / acquire timeout. */
const POOL_EXHAUSTION_PATTERN =
  /timeout exceeded when trying to connect|timeout acquiring a connection|pool is full|too many clients already/i;

const DEFAULT_PG_POOL_MAX = 5;
const PG_POOL_HEADROOM = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientDbError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return (
    TRANSIENT_DB_ERROR_CODES.has(code) ||
    /ECONNRESET|connection terminated|Connection terminated/i.test(message) ||
    POOL_EXHAUSTION_PATTERN.test(message)
  );
}

/**
 * Size pg pool for parallel Playwright workers (+ headroom for archive + main pools).
 * Override with PG_POOL_MAX when needed.
 */
export function resolvePgPoolMax(): number {
  if (env.PG_POOL_MAX != null && env.PG_POOL_MAX > 0) {
    return env.PG_POOL_MAX;
  }

  const workers = env.PLAYWRIGHT_WORKERS ?? 1;
  const workerCount = workers > 0 ? workers : 1;

  return Math.max(DEFAULT_PG_POOL_MAX, workerCount + PG_POOL_HEADROOM);
}

/** PostgreSQL stores unquoted database names as lowercase. */
function normalizeDatabaseName(name: string): string {
  return name.trim().toLowerCase();
}

export function isDbConfigured(): boolean {
  return isDbConfiguredFromEnv();
}

/** Archive DB (Billing_Class_D3, T_DPData_CateSP) — optional second database. */
export function isArchiveDbConfigured(): boolean {
  return isDbConfigured() && Boolean(env.DB_ARCHIVE_NAME);
}

export function readArchiveDbConfig(): DbConfig {
  const base = readDbConfig();
  const archiveName = normalizeDatabaseName(env.DB_ARCHIVE_NAME ?? "");
  if (!archiveName) {
    throw new Error("Missing DB_ARCHIVE_NAME in .env");
  }
  return { ...base, database: archiveName };
}

export function createArchivePgPool(config: DbConfig = readArchiveDbConfig()): pg.Pool {
  return createPgPool(config);
}

export function getMissingDbEnvKeys(): string[] {
  const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"] as const;
  const values: Record<(typeof required)[number], string | undefined> = {
    DB_HOST: env.DB_HOST,
    DB_USER: env.DB_USER,
    DB_PASSWORD: env.DB_PASSWORD,
    DB_NAME: env.DB_NAME,
  };
  return required.filter((key) => {
    const value = values[key];
    return value === undefined || String(value).trim() === "";
  });
}

export function readDbConfig(): DbConfig {
  const host = env.DB_HOST;
  const user = env.DB_USER;
  const database = normalizeDatabaseName(env.DB_NAME ?? "");
  const password = env.DB_PASSWORD;

  if (!host || !user || !database || password === undefined) {
    throw new Error("Missing DB env — set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in .env");
  }

  return {
    host,
    port: env.DB_PORT ?? 5432,
    user,
    password,
    database,
    ssl: env.DB_SSL,
  };
}

function resolvePgStatementTimeoutMs(): number {
  if (env.PG_STATEMENT_TIMEOUT_MS != null && env.PG_STATEMENT_TIMEOUT_MS > 0) {
    return env.PG_STATEMENT_TIMEOUT_MS;
  }
  return 45_000;
}

export function createPgPool(config: DbConfig = readDbConfig()): pg.Pool {
  const poolMax = resolvePgPoolMax();
  const connectionTimeoutMillis = env.PG_POOL_CONNECTION_TIMEOUT_MS ?? 20_000;
  const statementTimeoutMs = resolvePgStatementTimeoutMs();

  return new pg.Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    max: poolMax,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis,
    statement_timeout: statementTimeoutMs,
    query_timeout: statementTimeoutMs,
    keepAlive: true,
    ...(config.ssl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}

/** Close a pool without waiting forever on a stuck archive query. */
export async function closePgPool(pool: pg.Pool, waitMs = 5_000): Promise<void> {
  await Promise.race([pool.end().catch(() => undefined), sleep(waitMs)]);
}

function emitDbPoolRetry(
  attempt: number,
  attempts: number,
  reason: string,
  succeeded: boolean,
): void {
  const ctx = getCurrentContext();
  if (!ctx) {
    return;
  }
  appendEvent({
    kind: "retry",
    runId: ctx.runId,
    testId: ctx.testId,
    module: ctx.module,
    outcome: succeeded ? "pass" : "warn",
    layer: "db-pool",
    attempt,
    maxAttempts: attempts,
    reason,
    succeeded,
    target: "pg.query",
  });
}

async function queryWithRetry<T extends pg.QueryResultRow>(
  pool: pg.Pool,
  sql: string,
  params: unknown[],
  attempts = 3,
): Promise<pg.QueryResult<T>> {
  let lastError: unknown;
  let retried = false;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await pool.query<T>(sql, params);
      if (retried) {
        emitDbPoolRetry(attempt, attempts, "recovered after transient error", true);
      }
      return result;
    } catch (error) {
      lastError = error;
      const canRetry = attempt < attempts && isTransientDbError(error);
      if (!canRetry) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      emitDbPoolRetry(attempt, attempts, message, false);
      retried = true;
      const waitMs = attempt * 1500;
      console.warn(
        `[DB] Transient error (${attempt}/${attempts}), retrying in ${waitMs}ms:`,
        error instanceof Error ? error.message : error,
      );
      await sleep(waitMs);
    }
  }

  throw lastError;
}

/** Read-only guard — automation must never INSERT/UPDATE/DELETE via DB. */
export function assertReadOnlySql(sql: string): void {
  const normalized = sql
    .trim()
    .replace(/^\(\s*SELECT/i, "SELECT")
    .toUpperCase();
  if (!normalized.startsWith("SELECT") && !normalized.startsWith("WITH")) {
    throw new Error("DB validation allows SELECT / WITH queries only");
  }
  const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE)\b/;
  if (forbidden.test(normalized)) {
    throw new Error("DB validation blocked a mutating SQL statement");
  }
}

export async function queryReadOnly<T extends pg.QueryResultRow = pg.QueryResultRow>(
  pool: pg.Pool,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  assertReadOnlySql(sql);
  const result = await queryWithRetry<T>(pool, sql, params);
  return result.rows as T[];
}

export async function queryScalar<T>(
  pool: pg.Pool,
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await queryReadOnly<Record<string, unknown>>(pool, sql, params);
  if (rows.length === 0) {
    return null;
  }
  const first = rows[0];
  const value = Object.values(first)[0];
  return (value ?? null) as T | null;
}
