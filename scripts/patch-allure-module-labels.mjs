import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const RESULTS_DIR = path.join(ROOT, "allure-results");
const MODULE_PATH_RE = /[\\/]modules[\\/]([^\\/]+)[\\/]tests[\\/]/i;

const SUITE_LABEL_NAMES = new Set([
  "parentSuite",
  "suite",
  "subSuite",
  "epic",
  "feature",
  "story",
  "module",
  "package",
  "testClass",
]);

function moduleNameToSlug(moduleName) {
  return moduleName.toLowerCase().replace(/\s+/g, "-");
}

function resolveModuleFolder(result) {
  const titlePath = Array.isArray(result.titlePath) ? result.titlePath : [];
  const modulesIndex = titlePath.findIndex(
    (part) => String(part).toLowerCase() === "modules",
  );
  if (modulesIndex >= 0 && titlePath[modulesIndex + 1]) {
    return String(titlePath[modulesIndex + 1]);
  }

  const fromFullName = String(result.fullName ?? "").match(MODULE_PATH_RE);
  if (fromFullName?.[1]) {
    return fromFullName[1];
  }

  for (const label of result.labels ?? []) {
    if (label.name === "module" && label.value) {
      return label.value;
    }
  }

  return "other";
}

function resolveDescribeTitles(result) {
  const titlePath = Array.isArray(result.titlePath) ? result.titlePath : [];
  const testsIndex = titlePath.findIndex(
    (part) => String(part).toLowerCase() === "tests",
  );

  if (testsIndex >= 0) {
    return titlePath
      .slice(testsIndex + 1)
      .filter((part) => !/\.spec\.(ts|js)x?$/i.test(String(part)));
  }

  return titlePath.filter(
    (part) =>
      !/\.spec\.(ts|js)x?$/i.test(String(part)) &&
      String(part).toLowerCase() !== "modules" &&
      !MODULE_PATH_RE.test(String(part)),
  );
}

function resolveSpecFile(result, describeTitles) {
  const titlePath = Array.isArray(result.titlePath) ? result.titlePath : [];
  const specPart = titlePath.find((part) =>
    /\.spec\.(ts|js)x?$/i.test(String(part)),
  );
  if (specPart) {
    return String(specPart).replace(/\.spec\.(ts|js)x?$/i, "");
  }

  const fromFullName = String(result.fullName ?? "").match(
    /([^/\\]+)\.spec\.(?:ts|js)x?:/i,
  );
  if (fromFullName?.[1]) {
    return fromFullName[1];
  }

  return describeTitles[0] ?? "unknown";
}

function upsertLabels(result, entries) {
  const labels = (result.labels ?? []).filter(
    (label) => !SUITE_LABEL_NAMES.has(label.name),
  );

  for (const [name, value] of entries) {
    if (value) {
      labels.push({ name, value });
    }
  }

  result.labels = labels;
}

function patchResultFile(filePath) {
  const result = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const moduleFolder = resolveModuleFolder(result);
  const moduleSlug = moduleNameToSlug(moduleFolder);
  const describeTitles = resolveDescribeTitles(result);
  const specFile = resolveSpecFile(result, describeTitles);
  const suiteName = describeTitles[0] ?? specFile;
  const nestedDescribe =
    describeTitles.length > 1
      ? describeTitles.slice(1).join(" › ")
      : undefined;
  const testName = String(result.name ?? "unknown");
  const subSuiteName = nestedDescribe
    ? `${nestedDescribe} › ${testName}`
    : testName;

  upsertLabels(result, [
    ["parentSuite", moduleSlug],
    ["suite", suiteName],
    ["subSuite", subSuiteName],
    ["epic", moduleSlug],
    ["feature", suiteName],
    ["story", subSuiteName],
    ["module", moduleSlug],
    ["package", moduleSlug],
    ["testClass", specFile],
  ]);

  fs.writeFileSync(filePath, `${JSON.stringify(result)}\n`, "utf8");
}

function main() {
  if (!fs.existsSync(RESULTS_DIR)) {
    console.log("patch-allure-module-labels: no allure-results directory, skipping");
    return;
  }

  const resultFiles = fs
    .readdirSync(RESULTS_DIR)
    .filter((name) => name.endsWith("-result.json"));

  for (const fileName of resultFiles) {
    patchResultFile(path.join(RESULTS_DIR, fileName));
  }

  console.log(
    `patch-allure-module-labels: grouped ${resultFiles.length} test result(s) by module`,
  );
}

main();
