/**
 * Map changed file paths to module slugs for QA CI matrices.
 *
 * Rules:
 * - `src/modules/<MODULE>/...` → that module's slug
 * - shared runtime / config changes → all modules
 * - docs-only / unrelated paths → empty modules (skip API matrix)
 */
import { execFileSync } from "child_process";
import { discoverModules, moduleNameToSlug } from "./modules.mjs";

/** Paths that affect every module's runtime behavior. */
export const SHARED_RUNTIME_PREFIXES = [
  "src/core/",
  "src/fixtures/",
  "src/observability/",
  "src/global.setup.ts",
  "playwright.config.ts",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "scripts/run-module-tests.mjs",
  "scripts/sync-module-workflow.mjs",
  "scripts/lib/modules.mjs",
  "scripts/lib/detect-changed-modules.mjs",
  "scripts/detect-changed-modules.mjs",
  ".github/workflows/",
];

/** Paths that never require an API module matrix by themselves. */
export const DOCS_ONLY_PREFIXES = [
  "docs/",
  "README.md",
  ".gitignore",
  "LICENSE",
  ".env.example",
];

/**
 * @param {string} filePath
 * @returns {string}
 */
export function normalizePath(filePath) {
  return String(filePath ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
}

/**
 * @param {string} filePath
 * @param {string[]} prefixes
 */
function matchesAnyPrefix(filePath, prefixes) {
  return prefixes.some(
    (prefix) => filePath === prefix.replace(/\/$/, "") || filePath.startsWith(prefix),
  );
}

/**
 * @param {string} filePath
 * @returns {string | null} module folder name or null
 */
export function extractModuleFolder(filePath) {
  const normalized = normalizePath(filePath);
  const match = normalized.match(/^src\/modules\/([^/]+)\//);
  return match?.[1] ?? null;
}

/**
 * @param {string[]} changedFiles
 * @param {{ modules?: Array<{ slug: string; moduleName: string }> }} [options]
 */
export function detectChangedModules(changedFiles, options = {}) {
  const modules = options.modules ?? discoverModules();
  const allSlugs = modules.map((module) => module.slug).sort();
  const slugByFolder = new Map(
    modules.map((module) => [module.moduleName, module.slug]),
  );

  const files = (changedFiles ?? [])
    .map(normalizePath)
    .filter(Boolean);

  if (files.length === 0) {
    return {
      modules: [],
      reason: "no-changes",
      sharedImpact: false,
      docsOnly: false,
      runModules: false,
      matrix: [],
    };
  }

  const sharedFiles = files.filter((file) =>
    matchesAnyPrefix(file, SHARED_RUNTIME_PREFIXES),
  );
  if (sharedFiles.length > 0) {
    return {
      modules: allSlugs,
      reason: "shared-runtime",
      sharedImpact: true,
      docsOnly: false,
      runModules: allSlugs.length > 0,
      matrix: allSlugs.map((module) => ({ module })),
      sharedFiles,
    };
  }

  const detected = new Set();
  const unknownModuleFolders = [];

  for (const file of files) {
    const folder = extractModuleFolder(file);
    if (!folder) {
      continue;
    }
    const slug = slugByFolder.get(folder) ?? moduleNameToSlug(folder);
    if (slugByFolder.has(folder)) {
      detected.add(slug);
    } else {
      // Still surface the slug so CI fails loudly on unknown folders.
      detected.add(slug);
      unknownModuleFolders.push(folder);
    }
  }

  if (detected.size > 0) {
    const modulesList = [...detected].sort();
    return {
      modules: modulesList,
      reason: "module-paths",
      sharedImpact: false,
      docsOnly: false,
      runModules: true,
      matrix: modulesList.map((module) => ({ module })),
      unknownModuleFolders: [...new Set(unknownModuleFolders)].sort(),
    };
  }

  const nonDocs = files.filter(
    (file) => !matchesAnyPrefix(file, DOCS_ONLY_PREFIXES),
  );
  if (nonDocs.length === 0) {
    return {
      modules: [],
      reason: "docs-only",
      sharedImpact: false,
      docsOnly: true,
      runModules: false,
      matrix: [],
    };
  }

  // Non-module, non-shared changes (scripts probes, tooling) → skip matrix.
  return {
    modules: [],
    reason: "unrelated",
    sharedImpact: false,
    docsOnly: false,
    runModules: false,
    matrix: [],
    unrelatedFiles: nonDocs,
  };
}

/**
 * @param {string} baseRef
 * @param {string} [headRef]
 * @returns {string[]}
 */
export function listChangedFiles(baseRef, headRef = "HEAD") {
  if (!baseRef) {
    throw new Error("baseRef is required");
  }

  const output = execFileSync(
    "git",
    ["diff", "--name-only", "--diff-filter=ACDMR", `${baseRef}...${headRef}`],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Resolve a merge-base against the target branch (e.g. origin/QA).
 * @param {string} baseBranch
 * @param {string} [headRef]
 */
export function resolveMergeBase(baseBranch, headRef = "HEAD") {
  const output = execFileSync(
    "git",
    ["merge-base", baseBranch, headRef],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  return output.trim();
}
