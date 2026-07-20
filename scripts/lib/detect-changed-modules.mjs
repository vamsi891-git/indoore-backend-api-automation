/**
 * Map changed file paths to module slugs for QA CI matrices.
 *
 * Rules (module-first, MNC-style):
 * 1. Hard shared runtime (core/fixtures/playwright) → ALL modules
 * 2. Else any `src/modules/<MODULE>/...` → ONLY those modules
 *    (CI/docs/soft tooling alongside do NOT expand the matrix)
 * 3. Soft shared alone (package.json, runner scripts) → ALL modules
 * 4. CI/docs-only alone → skip API matrix
 */
import { execFileSync } from "child_process";
import { discoverModules, moduleNameToSlug } from "./modules.mjs";

/**
 * Changes that always invalidate every module's runtime behavior.
 * These expand the matrix to ALL modules even if a feature module also changed.
 */
export const HARD_SHARED_RUNTIME_PREFIXES = [
  "src/core/",
  "src/fixtures/",
  "src/observability/",
  "src/global.setup.ts",
  "playwright.config.ts",
  "tsconfig.json",
];

/**
 * Tooling that can affect installs/runners. Expands to ALL modules only when
 * no feature-module paths are in the same diff (module-first otherwise).
 */
export const SOFT_SHARED_RUNTIME_PREFIXES = [
  "package.json",
  "package-lock.json",
  "scripts/run-module-tests.mjs",
  "scripts/lib/modules.mjs",
];

/** Back-compat alias used by older callers/tests. */
export const SHARED_RUNTIME_PREFIXES = [
  ...HARD_SHARED_RUNTIME_PREFIXES,
  ...SOFT_SHARED_RUNTIME_PREFIXES,
];

/**
 * CI / workflow / detector changes — never expand the module matrix by themselves,
 * and ignored when feature modules are also in the diff.
 */
export const CI_ONLY_PREFIXES = [
  ".github/",
  "scripts/sync-module-workflow.mjs",
  "scripts/detect-changed-modules.mjs",
  "scripts/lib/detect-changed-modules.mjs",
  "scripts/check-env-example.mjs",
  "scripts/observability-ci-routing.mjs",
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
    (prefix) =>
      filePath === prefix.replace(/\/$/, "") || filePath.startsWith(prefix),
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

  const files = (changedFiles ?? []).map(normalizePath).filter(Boolean);

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

  const hardSharedFiles = files.filter((file) =>
    matchesAnyPrefix(file, HARD_SHARED_RUNTIME_PREFIXES),
  );
  const softSharedFiles = files.filter((file) =>
    matchesAnyPrefix(file, SOFT_SHARED_RUNTIME_PREFIXES),
  );
  const ciOnlyFiles = files.filter((file) =>
    matchesAnyPrefix(file, CI_ONLY_PREFIXES),
  );

  const detected = new Set();
  const unknownModuleFolders = [];

  for (const file of files) {
    const folder = extractModuleFolder(file);
    if (!folder) continue;
    const slug = slugByFolder.get(folder) ?? moduleNameToSlug(folder);
    if (slugByFolder.has(folder)) {
      detected.add(slug);
    } else {
      detected.add(slug);
      unknownModuleFolders.push(folder);
    }
  }

  // 1) Hard shared always fans out to every module.
  if (hardSharedFiles.length > 0) {
    return {
      modules: allSlugs,
      reason: "shared-runtime",
      sharedImpact: true,
      docsOnly: false,
      runModules: allSlugs.length > 0,
      matrix: allSlugs.map((module) => ({ module })),
      sharedFiles: hardSharedFiles,
    };
  }

  // 2) Module-first: feature module paths win over CI/docs/soft tooling in the same PR.
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
      ignoredCiFiles: ciOnlyFiles,
      ignoredSoftSharedFiles: softSharedFiles,
    };
  }

  // 3) Soft shared alone (e.g. package.json) → all modules.
  if (softSharedFiles.length > 0) {
    return {
      modules: allSlugs,
      reason: "shared-runtime",
      sharedImpact: true,
      docsOnly: false,
      runModules: allSlugs.length > 0,
      matrix: allSlugs.map((module) => ({ module })),
      sharedFiles: softSharedFiles,
    };
  }

  const nonDocs = files.filter(
    (file) => !matchesAnyPrefix(file, DOCS_ONLY_PREFIXES),
  );
  const nonCiAndDocs = nonDocs.filter(
    (file) => !matchesAnyPrefix(file, CI_ONLY_PREFIXES),
  );

  if (nonCiAndDocs.length === 0) {
    const docsOnly =
      files.every((file) => matchesAnyPrefix(file, DOCS_ONLY_PREFIXES)) ||
      (ciOnlyFiles.length > 0 &&
        files.every(
          (file) =>
            matchesAnyPrefix(file, DOCS_ONLY_PREFIXES) ||
            matchesAnyPrefix(file, CI_ONLY_PREFIXES),
        ));
    return {
      modules: [],
      reason: docsOnly && ciOnlyFiles.length === 0 ? "docs-only" : "ci-only",
      sharedImpact: false,
      docsOnly: docsOnly && ciOnlyFiles.length === 0,
      runModules: false,
      matrix: [],
      ciOnlyFiles,
    };
  }

  return {
    modules: [],
    reason: "unrelated",
    sharedImpact: false,
    docsOnly: false,
    runModules: false,
    matrix: [],
    unrelatedFiles: nonCiAndDocs,
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
  const output = execFileSync("git", ["merge-base", baseBranch, headRef], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return output.trim();
}
