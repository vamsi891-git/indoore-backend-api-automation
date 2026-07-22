import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { UTILS_LOOKUP_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { utilsLookupContractCases } from "../Data/utils-lookup-contract.data";
import { getLookupResponseData } from "../utils/lookup-spec.harness";

type Column = { key: string; header: string };

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function extractItems(data: Record<string, unknown>): unknown[] {
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.item)) return data.item;
  return [];
}

function extractColumns(data: Record<string, unknown>): Column[] {
  if (!Array.isArray(data.columns)) return [];
  return data.columns
    .map((column) => {
      const row = asRecord(column);
      return {
        key: String(row.key ?? ""),
        header: String(row.header ?? ""),
      };
    })
    .filter((column) => column.key.length > 0);
}

/**
 * Contract snapshots for all 14 live UTILS-LOOKUP endpoints.
 *
 * Failure means the backend contract changed (item keys, columns, envelope).
 * Accept intentional changes with:
 *   UPDATE_CONTRACT_SNAPSHOTS=true npm run test:utils-lookup:contract
 */
test.describe("UTILS-LOOKUP — Contract Snapshots", () => {
  test.setTimeout(UTILS_LOOKUP_TEST_TIMEOUT_MS);

  for (const contractCase of utilsLookupContractCases) {
    test(
      contractCase.testName,
      { tag: contractCase.tags },
      async ({ authenticatedApi }) => {
        await applyAllureTestCaseId(contractCase.testCaseId);

        const validation = new ValidationEngine();
        const assert = new AssertionEngine();
        const { rawResponse, responseBody, responseTime } =
          await contractCase.fetch(authenticatedApi);

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, 200, responseBody),
        );

        const data = asRecord(getLookupResponseData(responseBody));
        const items = extractItems(data);
        const firstItem = asRecord(items[0]);
        const itemKeys = Object.keys(firstItem);
        const columns = extractColumns(data);
        const hasColumnsGrid =
          contractCase.kind === "grid" && columns.length > 0;

        const snapshot = buildLookupItemsContractSnapshot({
          pathPattern: contractCase.pathPattern,
          dataKeys: Object.keys(data),
          itemKeys:
            itemKeys.length > 0
              ? itemKeys
              : columns.map((column) => column.key),
          hasColumnsGrid,
          columns: hasColumnsGrid ? columns : undefined,
        });

        await assertContractSnapshot(contractCase.snapshotName, snapshot);

        validation.printSummary(contractCase.testName, responseTime);
      },
    );
  }
});
