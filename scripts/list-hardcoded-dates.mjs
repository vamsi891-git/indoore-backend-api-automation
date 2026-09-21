/**
 * Phase 5 inventory — list hardcoded ISO dates in module Data files.
 * Default: list only (no writes). Pass --apply later after review.
 *
 * Usage:
 *   node scripts/list-hardcoded-dates.mjs
 *   node scripts/list-hardcoded-dates.mjs --json > reports/hardcoded-dates.json
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/modules");
const DATE_RE = /(?<![A-Za-z0-9_])(20\d{2}-\d{2}-\d{2})(?:[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?/g;

/** @type {{ file: string, line: number, match: string, context: string }[]} */
const hits = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!entry.name.endsWith(".data.ts")) continue;
    const text = fs.readFileSync(full, "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      DATE_RE.lastIndex = 0;
      let m;
      while ((m = DATE_RE.exec(line))) {
        hits.push({
          file: path.relative(process.cwd(), full).replaceAll("\\", "/"),
          line: idx + 1,
          match: m[0],
          context: line.trim().slice(0, 160),
        });
      }
    });
  }
}

walk(root);

const byFile = new Map();
for (const hit of hits) {
  if (!byFile.has(hit.file)) byFile.set(hit.file, []);
  byFile.get(hit.file).push(hit);
}

const asJson = process.argv.includes("--json");
if (asJson) {
  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        fileCount: byFile.size,
        hitCount: hits.length,
        files: [...byFile.entries()].map(([file, rows]) => ({
          file,
          count: rows.length,
          dates: [...new Set(rows.map((r) => r.match))],
          hits: rows,
        })),
      },
      null,
      2,
    ),
  );
} else {
  console.log(`Hardcoded dates in *.data.ts: ${hits.length} hits in ${byFile.size} files\n`);
  for (const [file, rows] of [...byFile.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const uniq = [...new Set(rows.map((r) => r.match))];
    console.log(`${file} (${rows.length} hits) — ${uniq.join(", ")}`);
    for (const row of rows) {
      console.log(`  L${row.line}: ${row.match}  |  ${row.context}`);
    }
    console.log("");
  }
  console.log(
    "LIST ONLY — no files were modified. Review this list, then approve a replace pass.",
  );
}
