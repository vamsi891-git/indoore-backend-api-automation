import pg from "pg";

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
  "57P01", // admin_shutdown
  "57P03", // cannot_connect_now
  "08006", // connection_failure
  "08001", // sqlclient_unable_to_establish_sqlconnection
]);

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
    /ECONNRESET|connection terminated|Connection terminated/i.test(message)
  );
}

/** PostgreSQL stores unquoted database names as lowercase. */
function normalizeDatabaseName(name: string): string {
  return name.trim().toLowerCase();
}

export function isDbConfigured(): boolean {
  return Boolean(
    process.env.DB_HOST?.trim() &&
      process.env.DB_USER?.trim() &&
      process.env.DB_PASSWORD &&
      process.env.DB_NAME?.trim(),
  );
}

/** Archive DB (Billing_Class_D3, T_DPData_CateSP) — optional second database. */
export function isArchiveDbConfigured(): boolean {
  return isDbConfigured() && Boolean(process.env.DB_ARCHIVE_NAME?.trim());
}

export function readArchiveDbConfig(): DbConfig {
  const base = readDbConfig();
  const archiveName = normalizeDatabaseName(process.env.DB_ARCHIVE_NAME ?? "");
  if (!archiveName) {
    throw new Error("Missing DB_ARCHIVE_NAME in .env");
  }
  return { ...base, database: archiveName };
}

export function createArchivePgPool(
  config: DbConfig = readArchiveDbConfig(),
): pg.Pool {
  return createPgPool(config);
}

export function getMissingDbEnvKeys(): string[] {
  const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"] as const;
  return required.filter((key) => {
    const value = process.env[key];
    return value === undefined || String(value).trim() === "";
  });
}

export function readDbConfig(): DbConfig {
  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const database = normalizeDatabaseName(process.env.DB_NAME ?? "");
  const password = process.env.DB_PASSWORD;

  if (!host || !user || !database || password === undefined) {
    throw new Error(
      "Missing DB env — set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in .env",
    );
  }

  return {
    host,
    port: Number(process.env.DB_PORT || 5432),
    user,
    password,
    database,
    ssl: process.env.DB_SSL?.trim().toLowerCase() === "true",
  };
}

export function createPgPool(config: DbConfig = readDbConfig()): pg.Pool {
  return new pg.Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    max: 2,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 20_000,
    keepAlive: true,
    ...(config.ssl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}

async function queryWithRetry<T extends pg.QueryResultRow>(
  pool: pg.Pool,
  sql: string,
  params: unknown[],
  attempts = 3,
): Promise<pg.QueryResult<T>> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await pool.query<T>(sql, params);
    } catch (error) {
      lastError = error;
      const canRetry = attempt < attempts && isTransientDbError(error);
      if (!canRetry) {
        throw error;
      }
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
  const normalized = sql.trim().replace(/^\(\s*SELECT/i, "SELECT").toUpperCase();
  if (!normalized.startsWith("SELECT") && !normalized.startsWith("WITH")) {
    throw new Error("DB validation allows SELECT / WITH queries only");
  }
  const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE)\b/;
  if (forbidden.test(normalized)) {
    throw new Error("DB validation blocked a mutating SQL statement");
  }
}

export async function queryReadOnly<
  T extends pg.QueryResultRow = pg.QueryResultRow,
>(
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
