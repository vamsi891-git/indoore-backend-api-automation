/**
 * Contract snapshot helper — catches display/metadata drift that Zod cannot see
 * (e.g. column header text renames, column reorders, key removals).
 *
 * A failing snapshot means the backend contract changed. Confirm it is intentional,
 * then re-run with UPDATE_CONTRACT_SNAPSHOTS=true to accept the new baseline.
 *
 * Snapshots live under contract-snapshots/ (git-tracked) so PR diffs surface
 * contract changes during review.
 *
 * snapshotName may contain `/` to create nested folders under contract-snapshots/
 * — e.g. `revenue-protection/cases-columns` resolves to
 * `contract-snapshots/revenue-protection/cases-columns.json`, not a flat file
 * such as `contract-snapshots/cases.json`. Always edit the nested path the
 * console reports on first create (see `[contract-snapshot] Created new snapshot at:`).
 */
import fs from "fs";
import path from "path";
import { attachment, step } from "allure-js-commons";

const ROOT = process.cwd();
const SNAPSHOT_DIR = path.join(ROOT, "contract-snapshots");

export type ContractDiffEntry = {
  path: string;
  kind: "added" | "removed" | "changed";
  expected?: unknown;
  actual?: unknown;
};

function shouldUpdateSnapshots(): boolean {
  return process.env.UPDATE_CONTRACT_SNAPSHOTS?.trim().toLowerCase() === "true";
}

/**
 * Resolve snapshotName to an absolute path under SNAPSHOT_DIR.
 * Rejects `..` segments and any resolution that escapes contract-snapshots/.
 */
function snapshotPath(snapshotName: string): string {
  const safe = snapshotName.replace(/[^a-zA-Z0-9._/-]/g, "_");
  if (!safe.trim()) {
    throw new Error("[contract-snapshot] snapshotName must not be empty");
  }
  if (safe.split(/[/\\]/).includes("..")) {
    throw new Error(
      `[contract-snapshot] snapshotName must not contain "..": ${snapshotName}`,
    );
  }

  const filePath = path.resolve(SNAPSHOT_DIR, `${safe}.json`);
  assertPathInsideSnapshotDir(filePath);
  return filePath;
}

function assertPathInsideSnapshotDir(filePath: string): void {
  const resolvedFile = path.resolve(filePath);
  const resolvedDir = path.resolve(SNAPSHOT_DIR);
  const relative = path.relative(resolvedDir, resolvedFile);
  if (
    relative === "" ||
    relative.startsWith(`..${path.sep}`) ||
    relative === ".." ||
    path.isAbsolute(relative)
  ) {
    throw new Error(
      `[contract-snapshot] Refusing path outside contract-snapshots/: ${resolvedFile}`,
    );
  }
}

function stableStringify(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function formatValue(value: unknown): string {
  if (value === undefined) return "(missing)";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Deep structural diff. Arrays are compared by index (order-sensitive).
 * Objects are compared by key set + values.
 */
export function diffContractValues(
  expected: unknown,
  actual: unknown,
  basePath = "$",
): ContractDiffEntry[] {
  const diffs: ContractDiffEntry[] = [];

  if (Object.is(expected, actual)) {
    return diffs;
  }

  if (expected === null || actual === null || typeof expected !== typeof actual) {
    diffs.push({
      path: basePath,
      kind: "changed",
      expected,
      actual,
    });
    return diffs;
  }

  if (Array.isArray(expected) && Array.isArray(actual)) {
    const max = Math.max(expected.length, actual.length);
    for (let i = 0; i < max; i++) {
      const childPath = `${basePath}[${i}]`;
      if (i >= expected.length) {
        diffs.push({ path: childPath, kind: "added", actual: actual[i] });
      } else if (i >= actual.length) {
        diffs.push({ path: childPath, kind: "removed", expected: expected[i] });
      } else {
        diffs.push(...diffContractValues(expected[i], actual[i], childPath));
      }
    }
    return diffs;
  }

  if (
    typeof expected === "object" &&
    typeof actual === "object" &&
    !Array.isArray(expected) &&
    !Array.isArray(actual)
  ) {
    const expectedObj = expected as Record<string, unknown>;
    const actualObj = actual as Record<string, unknown>;
    const keys = new Set([...Object.keys(expectedObj), ...Object.keys(actualObj)]);
    for (const key of [...keys].sort()) {
      const childPath = `${basePath}.${key}`;
      const hasExpected = Object.prototype.hasOwnProperty.call(expectedObj, key);
      const hasActual = Object.prototype.hasOwnProperty.call(actualObj, key);
      if (!hasExpected) {
        diffs.push({ path: childPath, kind: "added", actual: actualObj[key] });
      } else if (!hasActual) {
        diffs.push({
          path: childPath,
          kind: "removed",
          expected: expectedObj[key],
        });
      } else {
        diffs.push(
          ...diffContractValues(expectedObj[key], actualObj[key], childPath),
        );
      }
    }
    return diffs;
  }

  if (expected !== actual) {
    diffs.push({
      path: basePath,
      kind: "changed",
      expected,
      actual,
    });
  }

  return diffs;
}

export function formatContractDiff(diffs: ContractDiffEntry[]): string {
  if (diffs.length === 0) return "No differences.";
  const lines = [
    `Contract snapshot mismatch — ${diffs.length} difference(s):`,
    "",
  ];
  for (const diff of diffs) {
    if (diff.kind === "added") {
      lines.push(`  + ${diff.path}`);
      lines.push(`      actual:   ${formatValue(diff.actual)}`);
    } else if (diff.kind === "removed") {
      lines.push(`  - ${diff.path}`);
      lines.push(`      expected: ${formatValue(diff.expected)}`);
    } else {
      lines.push(`  ~ ${diff.path}`);
      lines.push(`      expected: ${formatValue(diff.expected)}`);
      lines.push(`      actual:   ${formatValue(diff.actual)}`);
    }
    lines.push("");
  }
  lines.push(
    "If this change is intentional, re-run with UPDATE_CONTRACT_SNAPSHOTS=true to accept the new contract.",
  );
  return lines.join("\n");
}

/**
 * Snapshot payload for revenue-protection grid contracts.
 * Only structural/display metadata — never full row business values.
 */
export type GridContractSnapshot = {
  columns: Array<{ key: string; header: string }>;
  /** Sorted row field keys (excluding volatile identity if desired by caller). */
  rowFieldKeys: string[];
};

export function buildGridContractSnapshot(input: {
  columns: Array<{ key: string; header: string }>;
  rowFieldKeys: string[];
}): GridContractSnapshot {
  return {
    columns: input.columns.map((column) => ({
      key: column.key,
      header: column.header,
    })),
    rowFieldKeys: [...input.rowFieldKeys].sort(),
  };
}

/**
 * Snapshot payload for utils-lookup catalogs / hierarchies / search lists.
 * Locks envelope + item field names — never business values (ids, names, etc.).
 */
export type LookupItemsContractSnapshot = {
  httpMethod: "GET";
  pathPattern: string;
  successEnvelopeKeys: string[];
  dataKeys: string[];
  itemKeys: string[];
  hasColumnsGrid: boolean;
  columns?: Array<{ key: string; header: string }>;
};

export function buildLookupItemsContractSnapshot(input: {
  pathPattern: string;
  dataKeys: string[];
  itemKeys: string[];
  hasColumnsGrid?: boolean;
  columns?: Array<{ key: string; header: string }>;
}): LookupItemsContractSnapshot {
  const hasColumnsGrid = input.hasColumnsGrid === true;
  return {
    httpMethod: "GET",
    pathPattern: input.pathPattern,
    successEnvelopeKeys: ["data", "success"].sort(),
    dataKeys: [...input.dataKeys].sort(),
    itemKeys: [...input.itemKeys].sort(),
    hasColumnsGrid,
    ...(hasColumnsGrid && input.columns
      ? {
          columns: input.columns.map((column) => ({
            key: column.key,
            header: column.header,
          })),
        }
      : {}),
  };
}

/**
 * Assert `actual` matches the stored contract snapshot.
 * Creates/updates the snapshot when missing or UPDATE_CONTRACT_SNAPSHOTS=true.
 *
 * @param snapshotName - May include `/` for nesting under contract-snapshots/
 *   (e.g. `revenue-protection/cases-columns` →
 *   `contract-snapshots/revenue-protection/cases-columns.json`).
 */
export async function assertContractSnapshot(
  snapshotName: string,
  actual: unknown,
): Promise<void> {
  const filePath = snapshotPath(snapshotName);
  const relativePath = path.relative(ROOT, filePath).replace(/\\/g, "/");
  const serialized = stableStringify(actual);
  const update = shouldUpdateSnapshots();
  const isNew = !fs.existsSync(filePath);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  if (isNew || update) {
    fs.writeFileSync(filePath, serialized, "utf8");
    if (isNew) {
      console.warn(
        `[contract-snapshot] Created new snapshot at: ${relativePath}`,
      );
    } else {
      console.warn(
        `[contract-snapshot] Updated snapshot (UPDATE_CONTRACT_SNAPSHOTS=true) at: ${relativePath}`,
      );
    }
    await step(`Contract snapshot ${update ? "updated" : "created"}: ${relativePath}`, async () => {
      await attachment(
        `contract-snapshot-${snapshotName.replace(/\//g, "__")}.json`,
        serialized,
        "application/json",
      );
    });
    return;
  }

  const expectedRaw = fs.readFileSync(filePath, "utf8");
  const expected = JSON.parse(expectedRaw) as unknown;
  const diffs = diffContractValues(expected, actual);

  if (diffs.length === 0) {
    await step(`Contract snapshot matched: ${relativePath}`, async () => {
      await attachment(
        `contract-snapshot-${snapshotName.replace(/\//g, "__")}.json`,
        serialized,
        "application/json",
      );
    });
    return;
  }

  const diffText = formatContractDiff(diffs);
  await step(`Contract snapshot MISMATCH: ${relativePath}`, async () => {
    await attachment(
      `contract-snapshot-diff-${snapshotName.replace(/\//g, "__")}.txt`,
      diffText,
      "text/plain",
    );
    await attachment(
      `contract-snapshot-expected-${snapshotName.replace(/\//g, "__")}.json`,
      stableStringify(expected),
      "application/json",
    );
    await attachment(
      `contract-snapshot-actual-${snapshotName.replace(/\//g, "__")}.json`,
      serialized,
      "application/json",
    );
  });

  throw new Error(diffText);
}
