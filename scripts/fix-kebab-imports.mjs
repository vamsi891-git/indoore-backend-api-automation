/**
 * Phase 3: update import paths after kebab-case renames.
 * Replaces path segments only; does not reformat files.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const EXTS = new Set([".ts", ".js", ".mjs", ".md"]);

const REPLACEMENTS = [
  ["/resultModel", "/result.model"],
  ["/summaryEngine", "/summary.engine"],
  ["/performancetracker", "/performance.tracker"],
  ["/networkmetric", "/network.metric"],
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

let changed = 0;
for (const file of walk(ROOT)) {
  let src = fs.readFileSync(file, "utf8");
  const original = src;
  for (const [from, to] of REPLACEMENTS) {
    src = src.split(from).join(to);
  }
  if (src !== original) {
    fs.writeFileSync(file, src);
    changed += 1;
    console.log(path.relative(ROOT, file));
  }
}
console.log(`updated ${changed} files`);
