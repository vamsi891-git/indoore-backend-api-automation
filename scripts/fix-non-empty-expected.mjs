/**
 * Fix Phase 5 flag placement: type aliases + indent + commented blocks.
 * Usage: node scripts/fix-non-empty-expected.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/modules");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".data.ts")) out.push(full);
  }
  return out;
}

let files = 0;
for (const file of walk(root)) {
  let text = fs.readFileSync(file, "utf8");
  const before = text;

  // Remove flags that landed inside commented-out blocks (orphan after // tags)
  text = text.replace(
    /(^\s*\/\/\s*tags\s*:\s*\[[^\]]*\]\s*,\s*\r?\n)\s*nonEmptyExpected:\s*(?:true|false),\s*\r?\n/gm,
    "$1",
  );

  // Add optional field on type aliases: export type FooTestCase = { ... }
  text = text.replace(
    /(export\s+type\s+\w*TestCase\s*=\s*\{)([\s\S]*?)(\n\};)/g,
    (block, open, body, close) => {
      if (/\bnonEmptyExpected\b/.test(body)) return block;
      return `${open}${body}  /** Smoke: primary list/table must be non-empty. */\n  nonEmptyExpected?: boolean;${close}`;
    },
  );

  // Normalize indent of nonEmptyExpected to match previous property line
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)nonEmptyExpected:\s*(true|false),?\s*$/);
    if (!m) continue;
    // find previous non-empty line indent
    let prevIndent = m[1];
    for (let j = i - 1; j >= 0; j--) {
      if (!lines[j].trim()) continue;
      const pm = lines[j].match(/^(\s*)\S/);
      if (pm) prevIndent = pm[1];
      break;
    }
    lines[i] = `${prevIndent}nonEmptyExpected: ${m[2]},`;
  }
  text = lines.join("\n");

  if (text !== before) {
    fs.writeFileSync(file, text, "utf8");
    files += 1;
  }
}
console.log(`Fixed ${files} data files`);
