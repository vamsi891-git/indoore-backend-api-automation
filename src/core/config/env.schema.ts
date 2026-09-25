import { z } from "zod";

/** Treat blank dotenv values as unset. */
function blankToUndefined(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

const optionalString = z.preprocess(blankToUndefined, z.string().optional());

const requiredString = z.preprocess(
  blankToUndefined,
  z.string({ error: "required" }).min(1, "required"),
);

/** "1" / "true" / "yes" → true; unset / other → false. */
const boolFlag = z.preprocess((value) => {
  if (value == null || value === "") {
    return false;
  }
  if (typeof value === "boolean") {
    return value;
  }
  const t = String(value).trim().toLowerCase();
  return t === "1" || t === "true" || t === "yes";
}, z.boolean());

const optionalPort = z.preprocess((value) => {
  const cleaned = blankToUndefined(value);
  if (cleaned === undefined) {
    return undefined;
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : cleaned;
}, z.number().int().min(1).max(65535).optional());

const optionalPositiveInt = z.preprocess((value) => {
  const cleaned = blankToUndefined(value);
  if (cleaned === undefined) {
    return undefined;
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : cleaned;
}, z.number().int().positive().optional());

/**
 * Framework env used by global setup, fixtures, and `src/core`.
 * Module-specific anchors (DTR_*, CONSUMER_*, …) stay as optional process.env reads.
 */
export const EnvSchema = z
  .object({
    BASE_URL: z.preprocess(
      blankToUndefined,
      z
        .string({ error: "required" })
        .min(1, "required")
        .refine((value) => {
          try {
            const url = new URL(value);
            return url.protocol === "http:" || url.protocol === "https:";
          } catch {
            return false;
          }
        }, "must be a valid http(s) origin (e.g. https://api.example.com)"),
    ),

    EMAIL: optionalString,
    USERNAME: optionalString,
    PASSWORD: requiredString,
    /** When set, login uses captchaId + this value as captcha text (skips OCR). */
    LOGIN_TESTER_PASSKEY: optionalString,

    TOTP_SECRET: optionalString,
    DEVICE_ID: optionalString,
    API_USER_AGENT: optionalString,

    STRIP_INDORE_PREFIX: boolFlag,
    ALLOW_WRITE_TESTS: boolFlag,

    API_TEST_PRINT_RESPONSE: boolFlag,
    API_TEST_VERBOSE_SUMMARY: boolFlag,
    UPDATE_CONTRACT_SNAPSHOTS: boolFlag,
    INCLUDE_MUTATION_PROOF: boolFlag,

    OBS_DISABLED: boolFlag,
    OBS_DEBUG: boolFlag,
    LOG_LEVEL: optionalString,
    TEST_TYPE: optionalString,

    SWAGGER_URL: optionalString,
    SWAGGER_PATH: optionalString,

    // Optional Postgres group — missing must not break default GET runs
    DB_HOST: optionalString,
    DB_PORT: optionalPort,
    DB_USER: optionalString,
    DB_PASSWORD: optionalString,
    DB_NAME: optionalString,
    DB_SSL: boolFlag,
    DB_ARCHIVE_NAME: optionalString,
    DB_CONSUMER_MASTER_VIEW: optionalString,
    PG_POOL_MAX: optionalPositiveInt,
    PG_POOL_CONNECTION_TIMEOUT_MS: optionalPositiveInt,
    PG_STATEMENT_TIMEOUT_MS: optionalPositiveInt,
    /** Alias for PLAYWRIGHT_WORKERS (Phase 7). Default 1 when both unset. */
    WORKERS: optionalPositiveInt,
    PLAYWRIGHT_WORKERS: optionalPositiveInt,

    // Optional LLM defect triage
    DEFECT_LLM_ENABLED: boolFlag,
    DEFECT_LLM_API_KEY: optionalString,
    OPENAI_API_KEY: optionalString,
    DEFECT_LLM_BASE_URL: optionalString,
    DEFECT_LLM_MODEL: optionalString,
    DEFECT_LLM_TIMEOUT_MS: optionalPositiveInt,

    // Platform (read-only; never required from .env)
    CI: boolFlag,
    GITHUB_ACTIONS: boolFlag,
  })
  .superRefine((data, ctx) => {
    if (!data.EMAIL && !data.USERNAME) {
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL"],
        message: "required (or set USERNAME)",
      });
      ctx.addIssue({
        code: "custom",
        path: ["USERNAME"],
        message: "required (or set EMAIL)",
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

function formatIssues(error: z.ZodError): string {
  const lines = error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    return `  - ${path}: ${issue.message}`;
  });
  return `Invalid environment configuration:\n${lines.join("\n")}`;
}

/**
 * Parse `process.env` once. Throws ONE Error listing every missing/invalid var.
 * Call from `global.setup.ts` before login.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(formatIssues(result.error));
  }
  cached = result.data;
  return cached;
}

/** Cached env; loads lazily if `loadEnv()` has not run yet (e.g. unit tests). */
export function getEnv(): Env {
  if (cached == null) {
    return loadEnv();
  }
  return cached;
}

/**
 * Typed env object for core code: `env.BASE_URL`, `env.PASSWORD`, …
 * Backed by `getEnv()` so it stays in sync after `loadEnv()` / strip-prefix updates.
 */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop) {
    if (typeof prop !== "string") {
      return undefined;
    }
    return getEnv()[prop as keyof Env];
  },
});

/** Login identity: EMAIL wins, else USERNAME. */
export function getLoginIdentity(e: Env = getEnv()): string {
  return e.EMAIL ?? e.USERNAME ?? "";
}

export function isDbConfiguredFromEnv(e: Env = getEnv()): boolean {
  return Boolean(e.DB_HOST && e.DB_USER && e.DB_PASSWORD && e.DB_NAME);
}

/**
 * Playwright worker count. Prefer WORKERS, else PLAYWRIGHT_WORKERS, else 1.
 * Solo default stays 1; raise only when measuring parallelism (Phase 7).
 */
export function resolvePlaywrightWorkers(e: Env = getEnv()): number {
  const raw = e.WORKERS ?? e.PLAYWRIGHT_WORKERS ?? 1;
  if (!Number.isFinite(raw) || raw < 1) {
    return 1;
  }
  return Math.min(Math.floor(raw), 8);
}

/**
 * Runtime toggle used when the live API has no `/indore` prefix.
 * Keeps `process.env` and the cached env object in sync.
 */
export function setStripIndorePrefix(enabled: boolean): void {
  process.env.STRIP_INDORE_PREFIX = enabled ? "true" : "false";
  if (cached != null) {
    cached = { ...cached, STRIP_INDORE_PREFIX: enabled };
  }
}
