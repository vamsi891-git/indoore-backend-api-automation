import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import {assertContractSnapshot,buildGridContractSnapshot,} from "../../../core/contract/contract-snapshot.helper";
import { CasesApi } from "../Api/cases.api";
import { casesDefaultQuery } from "../Data/cases.data";
import { CasesMapper } from "../Mapper/cases.mapper";
/**
 * Contract snapshot for Cases column metadata.
 *
 * Failure means the backend contract changed (header rename, reorder, or key drift).
 * Confirm intentional, then:
 *   UPDATE_CONTRACT_SNAPSHOTS=true npx playwright test cases.contract.spec.ts
 */
test.describe("Revenue Protection — Cases Contract Snapshot", () => {
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);
  test("IND-RPT-CONTRACT-001 — Cases columns contract snapshot",
    {
      tag: [
        "@revenue-protection",
        "@cases",
        "@contract-snapshot",
        "@aberrations-detail",
      ],
    },
    async ({ authenticatedApi }) => {
      await applyAllureTestCaseId("IND-RPT-CONTRACT-001");
      const api = new CasesApi(authenticatedApi);
      const validation = new ValidationEngine();
      const assert = new AssertionEngine();
      const { rawResponse, responseBody, responseTime } =
        await api.getCases(casesDefaultQuery);
      const mapped = CasesMapper.mapData(responseBody.data);
      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );
      const rowFieldKeys =mapped.rows[0] !== undefined ? Object.keys(mapped.rows[0]).filter((key) => key !== "id") : mapped.columns.map((column) => column.key);
      const snapshot = buildGridContractSnapshot({
        columns: mapped.columns,
        rowFieldKeys,
      });
      await assertContractSnapshot("revenue-protection/cases-columns",snapshot,);
      validation.printSummary("IND-RPT-CONTRACT-001 — Cases columns contract snapshot",responseTime,);
    },
  );
});
