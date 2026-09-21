/**
 * Phase 2: specs/harnesses import ApiValidationHelper instead of the engines.
 * Line-based; does not rewrite multi-line import blocks.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src");
const HELPER_ABS = path.resolve("src/core/helpers/api-validation.helper.ts");
const SKIP = new Set([
  path.resolve("src/core/engine/assertion.engine.ts"),
  path.resolve("src/core/engine/validation.engine.ts"),
  HELPER_ABS,
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

function helperFrom(file) {
  let rel = path
    .relative(path.dirname(file), HELPER_ABS)
    .replaceAll("\\", "/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel.replace(/\.ts$/, "");
}

function insertHelperImport(src, file) {
  if (/api-validation\.helper["']/.test(src)) {
    return src;
  }
  const line = `import { ApiValidationHelper } from "${helperFrom(file)}";\n`;
  const matches = [...src.matchAll(/^import[\s\S]*?;\r?\n/gm)];
  if (matches.length === 0) {
    return line + src;
  }
  const last = matches[matches.length - 1];
  const idx = last.index + last[0].length;
  return src.slice(0, idx) + line + src.slice(idx);
}

let changed = 0;
for (const file of walk(ROOT)) {
  if (SKIP.has(path.resolve(file))) continue;
  const original = fs.readFileSync(file, "utf8");
  let src = original;

  const mentionsEngine =
    /engine\/(assertion|validation)\.engine/.test(src) ||
    /\bAssertionEngine\b/.test(src) ||
    /\bValidationEngine\b/.test(src);
  if (!mentionsEngine) continue;

  src = src.replace(
    /import\(["'][^"']+\/engine\/validation\.engine["']\)\.ValidationEngine/g,
    "ApiValidationHelper",
  );
  src = src.replace(
    /import\(["'][^"']+\/engine\/assertion\.engine["']\)\.AssertionEngine/g,
    "ApiValidationHelper",
  );

  src = src
    .split(/\r?\n/)
    .filter(
      (line) =>
        !/from ["'][^"']+engine\/(assertion|validation)\.engine["']/.test(line),
    )
    .join("\n");

  src = src.replace(/\bnew AssertionEngine\(/g, "new ApiValidationHelper(");
  src = src.replace(/\bnew ValidationEngine\(/g, "new ApiValidationHelper(");
  src = src.replace(/\bAssertionEngine\b/g, "ApiValidationHelper");
  src = src.replace(/\bValidationEngine\b/g, "ApiValidationHelper");

  if (/\bApiValidationHelper\b/.test(src)) {
    src = insertHelperImport(src, file);
  }

  if (src !== original) {
    fs.writeFileSync(file, src);
    changed += 1;
    console.log(path.relative(process.cwd(), file));
  }
}

console.log(`updated ${changed} files`);
