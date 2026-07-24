/**
 * Scaffold contract / mutation / DB hardening stubs for a module.
 * Usage: node scripts/scaffold-module-hardening.mjs <MODULE_DIR_NAME> <slug> <TAG>
 */
import fs from "fs";
import path from "path";

const [, , moduleDir, slug, tag] = process.argv;
if (!moduleDir || !slug || !tag) {
  console.error("Usage: node scripts/scaffold-module-hardening.mjs MODULE_DIR slug @tag");
  process.exit(1);
}

const root = process.cwd();
const base = path.join(root, "src", "modules", moduleDir);
const gate = `${slug.replace(/-/g, "_").toUpperCase()}_DB_SQL_READY`;
const pascal = moduleDir
  .split("-")
  .map((p) => p.charAt(0) + p.slice(1).toLowerCase())
  .join("")
  .replace(/_/g, "");

const ensure = (file, contents) => {
  const full = path.join(base, file);
  if (fs.existsSync(full)) {
    console.log("skip exists", file);
    return;
  }
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents, "utf8");
  console.log("wrote", file);
};

ensure(
  `schemas/${slug}.schemas.ts`,
  `import { z } from "zod";

const emptyable = z.string();

/** Generic success envelope — tighten per-endpoint as live samples land. */
export const ${pascal}SuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.unknown(),
    message: emptyable.optional(),
  })
  .strict();

export const ${pascal}ListSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        items: z.array(z.record(z.string(), z.unknown())).optional(),
        modules: z.array(z.record(z.string(), z.unknown())).optional(),
        roles: z.array(z.record(z.string(), z.unknown())).optional(),
        users: z.array(z.record(z.string(), z.unknown())).optional(),
        notifications: z.array(z.record(z.string(), z.unknown())).optional(),
        logs: z.array(z.record(z.string(), z.unknown())).optional(),
        rows: z.array(z.record(z.string(), z.unknown())).optional(),
        pagination: z
          .object({
            page: z.number().optional(),
            limit: z.number().optional(),
            total: z.number().optional(),
            totalPages: z.number().optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough(),
    message: emptyable.optional(),
  })
  .strict();
`,
);

ensure(
  `Db/${slug}-sql.ts`,
  `/** Read-only SQL for ${moduleDir}. Gated by ${gate}=true. */
export const ${gate.replace(/_READY$/, "")}_SQL_TODO =
  "Paste backend repository SQL before enabling ${gate}";
`,
);

ensure(
  `Db/${slug}.db.ts`,
  `export function is${pascal}DbSqlReady(): boolean {
  return process.env.${gate}?.trim().toLowerCase() === "true";
}
`,
);

ensure(
  `Db/${slug}-db.validator.ts`,
  `import {
  attachDataQualityReport,
  type DataQualityReport,
  type DataQualityWarning,
} from "../../../core/utils/data-quality-logger";

function isBlank(value: unknown): boolean {
  return value == null || String(value).trim() === "";
}

export function collect${pascal}DataQualityFindings(
  kind: string,
  data: Record<string, unknown> | null | undefined,
): DataQualityReport {
  const warnings: DataQualityWarning[] = [];
  let emptyName = 0;
  if (data == null) return { warnings, counts: { emptyName } };

  const lists = ["items", "modules", "roles", "users", "notifications", "logs", "rows"]
    .map((k) => data[k])
    .filter(Array.isArray) as unknown[][];

  for (const list of lists) {
    for (const row of list) {
      const r = row as Record<string, unknown>;
      const name = r.name ?? r.title ?? r.consumerName ?? r.actorFullName;
      if (name !== undefined && isBlank(name)) {
        emptyName += 1;
        warnings.push({
          code: "EMPTY_NAME",
          message: \`\${kind} name/title empty\`,
          field: "name",
        });
      }
    }
  }

  return { warnings, counts: { emptyName } };
}

export async function log${pascal}DataQualityFindings(
  kind: string,
  data: Record<string, unknown> | null | undefined,
): Promise<DataQualityReport> {
  const report = collect${pascal}DataQualityFindings(kind, data);
  await attachDataQualityReport(report, \`${moduleDir} \${kind} DQ\`);
  return report;
}
`,
);

ensure(
  `Db/${slug}-db-compare.ts`,
  `import { compareApiToDb, type DbCompareObs } from "../../../core/db/db-compare.engine";

export function compare${pascal}CountLteDb(options: {
  label: string;
  apiCount: number;
  dbCount: number;
  obs?: DbCompareObs;
}): void {
  if (options.apiCount > options.dbCount) {
    throw new Error(
      \`\${options.label}: API \${options.apiCount} exceeds DB \${options.dbCount}\`,
    );
  }
  if (options.apiCount === options.dbCount) {
    compareApiToDb(
      [
        {
          label: options.label,
          apiValue: options.apiCount,
          dbValue: options.dbCount,
        },
      ],
      \`DB vs API — \${options.label}\`,
      options.obs,
    );
  }
}
`,
);

ensure(
  `tests/${slug}-db.harness.ts`,
  `import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { ValidationEngine } from "../../../core/engine/validation.engine";

/** Placeholder harness — expand when repository SQL is pasted. */
export async function run${pascal}DbCoverage(
  _authenticatedApi: APIRequestContext,
  _db: pg.Pool,
): Promise<void> {
  const validation = new ValidationEngine();
  validation.execute("${moduleDir} DB scaffold ready", () => {
    // Gate is on; SQL_TODO until paste — no-op pass.
  });
  validation.printSummary("${moduleDir} DB Coverage", 0);
}
`,
);

ensure(
  `tests/${slug}.db.spec.ts`,
  `import { test as apiDbTest } from "../../../fixtures/api-db.fixture";
import { isDbConfigured } from "../../../core/db/postgres.client";
import { is${pascal}DbSqlReady } from "../Db/${slug}.db";
import { run${pascal}DbCoverage } from "./${slug}-db.harness";

apiDbTest.describe("${moduleDir} — DB Coverage", () => {
  apiDbTest.setTimeout(120_000);

  apiDbTest.beforeEach(() => {
    apiDbTest.skip(!isDbConfigured(), "DB credentials not configured");
    apiDbTest.skip(
      !is${pascal}DbSqlReady(),
      "Set ${gate}=true after confirming Db/${slug}-sql.ts",
    );
  });

  apiDbTest(
    "IND-${tag.replace("@", "").slice(0, 3).toUpperCase()}-DB-001 — scaffold DB coverage",
    { tag: ["${tag}", "@db"] },
    async ({ authenticatedApi, db }) => {
      await run${pascal}DbCoverage(authenticatedApi, db);
    },
  );
});
`,
);

ensure(
  `tests/mutation-proof/fixtures/${slug}-sample.fixture.ts`,
  `export const sample${pascal}Success = {
  success: true as const,
  data: {
    items: [{ id: 1, name: "Sample" }],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
};
`,
);

ensure(
  `tests/mutation-proof/${slug}.mutation.spec.ts`,
  `import { test, expect } from "@playwright/test";
import {
  ${pascal}SuccessResponseSchema,
  ${pascal}ListSuccessResponseSchema,
} from "../../schemas/${slug}.schemas";
import { collect${pascal}DataQualityFindings } from "../../Db/${slug}-db.validator";
import { sample${pascal}Success } from "./fixtures/${slug}-sample.fixture";

test.describe("Mutation proof — ${moduleDir}", () => {
  test(
    "MUT-${slug.toUpperCase().slice(0, 6)}-001 — schema rejects success false",
    { tag: ["@mutation-proof", "${tag}"] },
    async () => {
      const mutated = structuredClone(sample${pascal}Success);
      (mutated as Record<string, unknown>).success = false;
      expect(${pascal}SuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-${slug.toUpperCase().slice(0, 6)}-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "${tag}"] },
    async () => {
      const mutated = structuredClone(sample${pascal}Success);
      (mutated as Record<string, unknown>).extraField = true;
      expect(${pascal}SuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-${slug.toUpperCase().slice(0, 6)}-003 — list schema accepts fixture",
    { tag: ["@mutation-proof", "${tag}"] },
    async () => {
      expect(${pascal}ListSuccessResponseSchema.safeParse(sample${pascal}Success).success).toBe(
        true,
      );
    },
  );

  test(
    "MUT-${slug.toUpperCase().slice(0, 6)}-004 — DQ flags blank name",
    { tag: ["@mutation-proof", "${tag}"] },
    async () => {
      const mutated = structuredClone(sample${pascal}Success.data);
      mutated.items[0].name = "";
      const report = collect${pascal}DataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );
});
`,
);

ensure(
  `tests/mutation-proof/db-cross-validation.mutation.spec.ts`,
  `import { test, expect } from "@playwright/test";
import { compareApiToDb } from "../../../../core/db/db-compare.engine";
import { compare${pascal}CountLteDb } from "../../Db/${slug}-db-compare";

test.describe("Mutation proof — ${moduleDir} DB (fixture)", () => {
  test(
    "MUT-${slug.toUpperCase().slice(0, 6)}-DB-001 — compareApiToDb fails on mismatch",
    { tag: ["@mutation-proof", "${tag}"] },
    async () => {
      let caught: Error | undefined;
      try {
        compareApiToDb(
          [{ label: "count", apiValue: 1, dbValue: 2 }],
          "Mutation proof — ${slug} mismatch",
        );
      } catch (error: unknown) {
        caught = error instanceof Error ? error : new Error(String(error));
      }
      expect(caught?.message ?? "").toMatch(/count|mismatch/i);
    },
  );

  test(
    "MUT-${slug.toUpperCase().slice(0, 6)}-DB-002 — lte assert fails when API > DB",
    { tag: ["@mutation-proof", "${tag}"] },
    async () => {
      expect(() =>
        compare${pascal}CountLteDb({ label: "total", apiCount: 5, dbCount: 1 }),
      ).toThrow(/exceeds|total/i);
    },
  );
});
`,
);

ensure(
  `tests/mutation-proof/mutation-testing-proof.md`,
  `# ${moduleDir} — Mutation / Contract / DB proof

\`\`\`bash
npm run test:${slug}:contract
npm run test:${slug}:mutation-proof
# ${gate}=true
npm run test:${slug}:db
\`\`\`

Gate: \`${gate}=true\` · SQL may be TODO until repository paste.
`,
);

console.log("Scaffold complete for", moduleDir);
