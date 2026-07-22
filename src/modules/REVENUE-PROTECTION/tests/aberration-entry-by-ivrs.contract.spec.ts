import { test } from "../../../fixtures/api.fixture";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { assertContractSnapshot } from "../../../core/contract/contract-snapshot.helper";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
/**
 * PATCH /indore/revenue-protection/aberration-entry/:ivrsNo does NOT return a
 * columns/rows grid — success body is `{ success: true, data: { ivrsNo } }`.
 *
 * This snapshot locks that response shape (keys only) so a silent rename of
 * `ivrsNo` → `ivrs` (or dropping `data`) still fails. No live PATCH — mutating
 * production rows is not appropriate for a read-only contract check.
 */
test.describe("Revenue Protection — Aberration Entry By IVRS Contract Snapshot",
  () => {
    test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);
    test("IND-RPT-ABE-IVRS-CONTRACT-001 — By-IVRS PATCH success response keys contract",
      {
        tag: [
          "@revenue-protection",
          "@aberration-entry-by-ivrs",
          "@contract-snapshot",
        ],
      },
      async () => {
        await applyAllureTestCaseId("IND-RPT-ABE-IVRS-CONTRACT-001");
        await assertContractSnapshot(
          "revenue-protection/aberration-entry-by-ivrs-response",
          {
            httpMethod: "PATCH",
            pathPattern: "/indore/revenue-protection/aberration-entry/:ivrsNo",
            successEnvelopeKeys: ["success", "data"].sort(),
            dataKeys: ["ivrsNo"].sort(),
            hasColumnsGrid: false,
          },
        );
      },
    );
  },
);
