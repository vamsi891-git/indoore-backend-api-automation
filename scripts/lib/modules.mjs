import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const MODULES_DIR = path.join(ROOT, "src", "modules");

export function moduleNameToSlug(moduleName) {
  return moduleName.toLowerCase().replace(/\s+/g, "-");
}

export function discoverModules() {
  if (!fs.existsSync(MODULES_DIR)) {
    return [];
  }

  return fs
    .readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((moduleName) =>
      fs.existsSync(path.join(MODULES_DIR, moduleName, "tests")),
    )
    .sort()
    .map((moduleName) => {
      const slug = moduleNameToSlug(moduleName);
      const testPath = path
        .join("src", "modules", moduleName, "tests")
        .replace(/\\/g, "/");
      return { slug, moduleName, testPath };
    });
}

export function getModuleBySlug(slug) {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase();
  return discoverModules().find((module) => module.slug === normalized) ?? null;
}

export function listModulesText() {
  const modules = discoverModules();
  const lines = ["Available modules:", ""];
  for (const module of modules) {
    lines.push(`  ${module.slug.padEnd(24)} → ${module.testPath}`);
  }
  lines.push("");
  lines.push("Examples:");
  lines.push("  npm run test:module -- energy-audits");
  lines.push("  npm run test:module -- energy-audits --smoke");
  return lines.join("\n");
}
