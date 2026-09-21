/**
 * Phase 6 — rewrite imports after moving optional pkgs to src/extras/.
 * Usage: node scripts/rewrite-extras-imports.mjs
 */
import fs from "node:fs";
import path from "node:path";

const roots = ["src", "scripts"];
const exts = new Set([".ts", ".mjs", ".md"]);

/** @type {[RegExp, string][]} */
const rules = [
  // From modules/* (any depth) and fixtures: core/db|contract|ai → extras/...
  [/from\s+(["'])((?:\.\.\/)+)core\/db\//g, "from $1$2extras/db/"],
  [/from\s+(["'])((?:\.\.\/)+)core\/contract\//g, "from $1$2extras/contract/"],
  [/from\s+(["'])((?:\.\.\/)+)core\/ai\//g, "from $1$2extras/ai/"],
  // observability was at src/observability
  [/from\s+(["'])((?:\.\.\/)+)observability\//g, "from $1$2extras/observability/"],
  [/from\s+(["'])\.\/observability\//g, "from $1./extras/observability/"],
  // core engine / helpers: ../ai → ../../extras/ai ; ../../observability → ../../extras/observability
  [/from\s+(["'])\.\.\/ai\//g, "from $1../../extras/ai/"],
  [/from\s+(["'])\.\.\/\.\.\/observability\//g, "from $1../../extras/observability/"],
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "extras") {
        // still walk extras for internal path fixes separately
        if (entry.name === "extras") walk(full, out);
        continue;
      }
      walk(full, out);
    } else if (exts.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

let changed = 0;
for (const root of roots) {
  for (const file of walk(root)) {
    // Skip rewriting inside extras with the module-relative rules first;
    // extras gets its own pass below.
    let text = fs.readFileSync(file, "utf8");
    const before = text;
    for (const [re, rep] of rules) {
      text = text.replace(re, rep);
    }
    if (text !== before) {
      fs.writeFileSync(file, text);
      changed += 1;
      console.log("updated", path.relative(process.cwd(), file).replaceAll("\\", "/"));
    }
  }
}

// Fix imports inside src/extras/* (sibling packages + env.schema path)
for (const file of walk("src/extras")) {
  let text = fs.readFileSync(file, "utf8");
  const before = text;
  // Was ../../observability from core/db → now ../observability
  text = text.replace(
    /from\s+(["'])\.\.\/\.\.\/observability\//g,
    "from $1../observability/",
  );
  // Was ../core/config from observability → ../../core/config
  text = text.replace(
    /from\s+(["'])\.\.\/core\/config\//g,
    "from $1../../core/config/",
  );
  // Was ../../core/config if somehow present — leave
  // db-compare / postgres may import env from wrong path
  text = text.replace(
    /from\s+(["'])\.\.\/config\/env\.schema(["'])/g,
    "from $1../../core/config/env.schema$2",
  );
  text = text.replace(
    /from\s+(["'])\.\.\/\.\.\/core\/config\/env\.schema(["'])/g,
    "from $1../../core/config/env.schema$2",
  );
  if (text !== before) {
    fs.writeFileSync(file, text);
    changed += 1;
    console.log("extras-fix", path.relative(process.cwd(), file).replaceAll("\\", "/"));
  }
}

console.log(`Changed ${changed} files`);
