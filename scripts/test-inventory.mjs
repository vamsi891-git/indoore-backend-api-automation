/**
 * Scans src/modules and reports:
 * - test case count per module
 * - API files without matching spec
 * - spec files without matching API
 *
 * Run: npm run test:inventory
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const MODULES_DIR = path.join(ROOT, "src", "modules");
const REPORT_DIR = path.join(ROOT, "reports");
const REPORT_FILE = path.join(REPORT_DIR, "test-inventory.md");

function walk(dir, filter) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, filter));
    } else if (filter(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function baseName(filePath) {
  return path.basename(filePath).replace(/\.(api|spec)\.ts$/, "");
}

function countTests(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const matches = text.match(/\btest(?:\.only|\.skip)?\s*\(/g);
  return matches ? matches.length : 0;
}

function extractTags(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const tags = new Set();
  for (const m of text.matchAll(/tag:\s*\[([^\]]+)\]/g)) {
    for (const t of m[1].match(/@[\w-]+/g) ?? []) {
      tags.add(t);
    }
  }
  return [...tags];
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

function main() {
  const modules = fs
    .readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const rows = [];
  let totalSpecs = 0;
  let totalTests = 0;
  let totalApis = 0;
  const allMissingTests = [];
  const allOrphanSpecs = [];
  const tagCounts = {};

  for (const moduleName of modules) {
    const modulePath = path.join(MODULES_DIR, moduleName);
    const apiFiles = walk(modulePath, (n) => n.endsWith(".api.ts"));
    const specFiles = walk(modulePath, (n) => n.endsWith(".spec.ts"));

    const apiBases = new Set(apiFiles.map(baseName));
    const specBases = new Set(specFiles.map(baseName));

    const moduleTests = specFiles.reduce((sum, f) => sum + countTests(f), 0);
    const missingTests = [...apiBases]
      .filter((b) => !specBases.has(b))
      .map((b) => {
        const file = apiFiles.find((f) => baseName(f) === b);
        return rel(file);
      });
    const orphanSpecs = [...specBases]
      .filter((b) => !apiBases.has(b))
      .map((b) => {
        const file = specFiles.find((f) => baseName(f) === b);
        return rel(file);
      });

    for (const spec of specFiles) {
      for (const tag of extractTags(spec)) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + countTests(spec);
      }
    }

    totalSpecs += specFiles.length;
    totalTests += moduleTests;
    totalApis += apiFiles.length;
    allMissingTests.push(...missingTests.map((f) => ({ module: moduleName, file: f })));
    allOrphanSpecs.push(...orphanSpecs.map((f) => ({ module: moduleName, file: f })));

    rows.push({
      module: moduleName,
      apis: apiFiles.length,
      specs: specFiles.length,
      tests: moduleTests,
      coverage:
        apiFiles.length === 0
          ? "—"
          : `${Math.round((1 - missingTests.length / apiFiles.length) * 100)}%`,
      missing: missingTests.length,
    });
  }

  const lines = [
    "# API Test Inventory",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "|--------|------:|",
    `| Modules | ${modules.length} |`,
    `| API files | ${totalApis} |`,
    `| Spec files | ${totalSpecs} |`,
    `| Test cases | ${totalTests} |`,
    `| APIs without spec | ${allMissingTests.length} |`,
    `| Specs without API | ${allOrphanSpecs.length} |`,
    "",
    "## By module",
    "",
    "| Module | APIs | Specs | Tests | API coverage | Missing specs |",
    "|--------|-----:|------:|------:|-------------:|--------------:|",
    ...rows.map(
      (r) =>
        `| ${r.module} | ${r.apis} | ${r.specs} | ${r.tests} | ${r.coverage} | ${r.missing} |`,
    ),
    "",
    "## Tags (test case count)",
    "",
    "| Tag | Tests |",
    "|-----|------:|",
    ...Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => `| ${tag} | ${count} |`),
    "",
  ];

  if (allMissingTests.length) {
    lines.push("## APIs missing tests", "");
    for (const { module, file } of allMissingTests) {
      lines.push(`- **${module}** — \`${file}\``);
    }
    lines.push("");
  }

  if (allOrphanSpecs.length) {
    lines.push("## Specs without matching API file", "");
    lines.push("_Often multi-API flows (e.g. AUTH invite) or renamed APIs._", "");
    for (const { module, file } of allOrphanSpecs) {
      lines.push(`- **${module}** — \`${file}\``);
    }
    lines.push("");
  }

  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
  fs.writeFileSync(REPORT_FILE, lines.join("\n"), "utf8");

  console.log("\n=== API TEST INVENTORY ===\n");
  console.log(`Modules:     ${modules.length}`);
  console.log(`API files:   ${totalApis}`);
  console.log(`Spec files:  ${totalSpecs}`);
  console.log(`Test cases:  ${totalTests}`);
  console.log(`Missing:     ${allMissingTests.length} APIs without spec`);
  console.log(`Orphan:      ${allOrphanSpecs.length} specs without API`);
  console.log(`\nReport: ${rel(REPORT_FILE)}\n`);

  for (const r of rows) {
    const flag = r.missing > 0 ? `  (${r.missing} API(s) need spec)` : "";
    console.log(
      `  ${r.module.padEnd(24)} APIs ${String(r.apis).padStart(3)}  Specs ${String(r.specs).padStart(3)}  Tests ${String(r.tests).padStart(3)}${flag}`,
    );
  }

  if (allMissingTests.length) {
    console.log("\n--- APIs missing tests ---");
    for (const { file } of allMissingTests) {
      console.log(`  ${file}`);
    }
  }
}

main();
