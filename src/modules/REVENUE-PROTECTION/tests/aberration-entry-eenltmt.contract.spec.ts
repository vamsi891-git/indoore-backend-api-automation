import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { assertContractSnapshot,buildGridContractSnapshot,} from "../../../core/contract/contract-snapshot.helper";
import { AberrationEntryApi } from "../Api/aberration-entry.api";
import { aberrationEntryEenltmtDefaultQuery } from "../Data/aberration-entry-eenltmt.data";
import { AberrationEntryMapper } from "../Mapper/aberration-entry.mapper";

/**
 * Contract snapshot for Aberration Entry (EENLTMT) column metadata.
 * GET /indore/revenue-protection/aberration-entry/eenltmt
 */
test.describe("Revenue Protection — Aberration Entry EENLTMT Contract Snapshot",() => {
    test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);
    test("IND-RPT-ABE-EEN-CONTRACT-001 — Aberration Entry EENLTMT columns contract snapshot",
      {
        tag: [
          "@revenue-protection",
          "@aberration-entry-eenltmt",
          "@contract-snapshot",
        ],
      },
      async ({ authenticatedApi }) => {
        await applyAllureTestCaseId("IND-RPT-ABE-EEN-CONTRACT-001");
        const api = new AberrationEntryApi(authenticatedApi);
        const validation = new ValidationEngine();
        const assert = new AssertionEngine();
        const { rawResponse, responseBody, responseTime } =
          await api.getAberrationEntry(aberrationEntryEenltmtDefaultQuery);
        const mapped = AberrationEntryMapper.mapData(responseBody.data);
        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, 200, responseBody),
        );
        const rowFieldKeys =
          mapped.rows[0] !== undefined
            ? Object.keys(mapped.rows[0]).filter((key) => key !== "id")
            : mapped.columns.map((column) => column.key);
        await assertContractSnapshot(
          "revenue-protection/aberration-entry-eenltmt-columns",
          buildGridContractSnapshot({
            columns: mapped.columns,
            rowFieldKeys,
          }),
        );
        validation.printSummary("IND-RPT-ABE-EEN-CONTRACT-001 — Aberration Entry EENLTMT columns contract snapshot",responseTime,);
      },
    );
  },
);
