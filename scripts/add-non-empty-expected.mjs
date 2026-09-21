/**
 * Phase 5 — add `nonEmptyExpected` to Data test-case objects.
 *
 * Rules:
 * - tags include @smoke → nonEmptyExpected: true
 * - tags present without @smoke → nonEmptyExpected: false
 * - skip if already set
 * - also add optional field on `*TestCase` interfaces when missing
 *
 * Usage:
 *   node scripts/add-non-empty-expected.mjs           # dry-run
 *   node scripts/add-non-empty-expected.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";

const apply = process.argv.includes("--apply");
const root = path.resolve("src/modules");

/** @type {{ file: string, smoke: number, regression: number, interfaces: number }[]} */
const summary = [];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".data.ts")) out.push(full);
  }
  return out;
}

function patchFile(file) {
  let text = fs.readFileSync(file, "utf8");
  let smoke = 0;
  let regression = 0;
  let interfaces = 0;

  // Optional field on TestCase interfaces
  text = text.replace(
    /(export\s+interface\s+\w*TestCase\s*(?:extends\s+[^{]+)?\{)([\s\S]*?)(\n\})/g,
    (block, open, body, close) => {
      if (/\bnonEmptyExpected\b/.test(body)) return block;
      interfaces += 1;
      const indent = "  ";
      return `${open}${body}${indent}/** Smoke: primary list/table must be non-empty. */\n${indent}nonEmptyExpected?: boolean;${close}`;
    },
  );

  // Insert after tags: [...] lines inside object literals
  text = text.replace(
    /(tags\s*:\s*\[[^\]]*\]\s*,)(\r?\n)(\s*)(?!nonEmptyExpected)/g,
    (full, tagsLine, nl, indent) => {
      const isSmoke = /@smoke/.test(tagsLine);
      if (isSmoke) smoke += 1;
      else regression += 1;
      const value = isSmoke ? "true" : "false";
      return `${tagsLine}${nl}${indent}nonEmptyExpected: ${value},${nl}${indent}`;
    },
  );

  // Avoid double-blank / broken indent: collapse "indent\nindent" after insert
  // (replace leaves trailing indent from lookahead skip — trim duplicate)
  text = text.replace(
    /(nonEmptyExpected:\s*(?:true|false),)\r?\n(\s+)\r?\n(\s+)/g,
    "$1\n$2",
  );

  if (smoke + regression + interfaces === 0) return null;

  const rel = path.relative(process.cwd(), file).replaceAll("\\", "/");
  summary.push({ file: rel, smoke, regression, interfaces });
  if (apply) fs.writeFileSync(file, text, "utf8");
  return { smoke, regression, interfaces };
}

for (const file of walk(root)) {
  patchFile(file);
}

const totals = summary.reduce(
  (a, s) => ({
    files: a.files + 1,
    smoke: a.smoke + s.smoke,
    regression: a.regression + s.regression,
    interfaces: a.interfaces + s.interfaces,
  }),
  { files: 0, smoke: 0, regression: 0, interfaces: 0 },
);

console.log(
  apply
    ? `Applied nonEmptyExpected in ${totals.files} files`
    : `DRY-RUN — would touch ${totals.files} files (pass --apply to write)`,
);
console.log(
  `  smoke=true: ${totals.smoke}, regression=false: ${totals.regression}, interfaces: ${totals.interfaces}`,
);
for (const row of summary.slice(0, 40)) {
  console.log(
    `  ${row.file}  smoke=${row.smoke} reg=${row.regression} iface=${row.interfaces}`,
  );
}
if (summary.length > 40) console.log(`  … +${summary.length - 40} more`);
