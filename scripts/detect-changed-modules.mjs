/**
 * Detect modules affected by a Git diff for QA CI matrices.
 *
 * Usage:
 *   node scripts/detect-changed-modules.mjs --base origin/QA
 *   node scripts/detect-changed-modules.mjs --base origin/QA --head HEAD
 *   node scripts/detect-changed-modules.mjs --files path1 path2
 *   node scripts/detect-changed-modules.mjs --test
 *
 * Outputs JSON:
 *   { modules, reason, sharedImpact, docsOnly, runModules, matrix }
 *
 * When GITHUB_OUTPUT is set, also writes:
 *   modules_json, run_modules, reason, modules_csv
 */
import fs from "fs";
import {
  detectChangedModules,
  listChangedFiles,
  resolveMergeBase,
} from "./lib/detect-changed-modules.mjs";
import { discoverModules } from "./lib/modules.mjs";

function parseArgs(argv) {
  const args = {
    base: null,
    head: "HEAD",
    files: null,
    test: false,
    mergeBase: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--base") {
      args.base = argv[++i];
    } else if (arg === "--head") {
      args.head = argv[++i] ?? "HEAD";
    } else if (arg === "--files") {
      args.files = [];
      while (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        args.files.push(argv[++i]);
      }
    } else if (arg === "--no-merge-base") {
      args.mergeBase = false;
    } else if (arg === "--test") {
      args.test = true;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    }
  }

  return args;
}

function writeGithubOutput(result) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    return;
  }

  const modulesJson = JSON.stringify(result.modules);
  const matrixJson = JSON.stringify(result.matrix);
  const lines = [
    `modules_json=${modulesJson}`,
    `matrix_json=${matrixJson}`,
    `run_modules=${result.runModules ? "true" : "false"}`,
    `reason=${result.reason}`,
    `modules_csv=${result.modules.join(",")}`,
    `docs_only=${result.docsOnly ? "true" : "false"}`,
    `shared_impact=${result.sharedImpact ? "true" : "false"}`,
  ];
  fs.appendFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runSelfTests() {
  const modules = [
    { slug: "auth", moduleName: "AUTH" },
    { slug: "dashboard", moduleName: "DASHBOARD" },
    { slug: "master-data", moduleName: "MASTER-DATA" },
  ];

  const one = detectChangedModules(
    ["src/modules/DASHBOARD/Api/dashboardmetrics.api.ts"],
    { modules },
  );
  assert(one.modules.join(",") === "dashboard", "single module detection failed");
  assert(one.runModules === true, "single module should run");
  assert(one.reason === "module-paths", "expected module-paths reason");

  const multi = detectChangedModules(
    [
      "src/modules/AUTH/tests/login.spec.ts",
      "src/modules/MASTER-DATA/Api/create-meter.api.ts",
    ],
    { modules },
  );
  assert(
    multi.modules.join(",") === "auth,master-data",
    "multi-module detection failed",
  );

  const shared = detectChangedModules(["src/core/engine/validation.engine.ts"], {
    modules,
  });
  assert(shared.sharedImpact === true, "shared core should set sharedImpact");
  assert(
    shared.modules.join(",") === "auth,dashboard,master-data",
    "shared core should return all modules",
  );

  const renamed = detectChangedModules(
    ["src/modules/DASHBOARD/tests/renamed.spec.ts"],
    { modules },
  );
  assert(renamed.modules.join(",") === "dashboard", "rename path detection failed");

  const docs = detectChangedModules(["docs/FRAMEWORK-NOTES.md", "README.md"], {
    modules,
  });
  assert(docs.docsOnly === true, "docs-only detection failed");
  assert(docs.runModules === false, "docs-only should skip modules");
  assert(docs.modules.length === 0, "docs-only should have empty modules");

  const fixtureShared = detectChangedModules(["src/fixtures/api.fixture.ts"], {
    modules,
  });
  assert(fixtureShared.sharedImpact === true, "fixture change should be shared");

  const packageShared = detectChangedModules(["package.json"], { modules });
  assert(packageShared.sharedImpact === true, "package.json should be shared");

  const empty = detectChangedModules([], { modules });
  assert(empty.reason === "no-changes", "empty change set failed");
  assert(empty.runModules === false, "empty change set should not run");

  // Live discovery still works for docs-only against the real repo modules.
  const liveDocs = detectChangedModules(["docs/FRAMEWORK-NOTES.md"]);
  assert(liveDocs.docsOnly === true, "live docs-only detection failed");

  console.log("detect-changed-modules self-tests passed");
  console.log(
    JSON.stringify(
      {
        ok: true,
        discoveredModules: discoverModules().length,
      },
      null,
      2,
    ),
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(`Usage:
  node scripts/detect-changed-modules.mjs --base <ref> [--head <ref>]
  node scripts/detect-changed-modules.mjs --files <path> [<path>...]
  node scripts/detect-changed-modules.mjs --test`);
    process.exit(0);
  }

  if (args.test) {
    runSelfTests();
    process.exit(0);
  }

  let changedFiles;
  if (args.files) {
    changedFiles = args.files;
  } else if (args.base) {
    const baseRef =
      args.mergeBase && !args.base.includes("...")
        ? resolveMergeBase(args.base, args.head)
        : args.base;
    changedFiles = listChangedFiles(baseRef, args.head);
  } else {
    console.error(
      "Provide --base <ref> or --files <paths...>, or run with --test",
    );
    process.exit(1);
  }

  const result = detectChangedModules(changedFiles);
  writeGithubOutput(result);
  console.log(JSON.stringify(result, null, 2));
}

main();
