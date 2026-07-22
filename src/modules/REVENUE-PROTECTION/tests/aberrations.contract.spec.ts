import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import {
  assertContractSnapshot,
  buildGridContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { AberrationsApi } from "../Api/aberrations.api";
import { aberrationsDefaultQuery } from "../Data/aberrations.data";
import { AberrationsMapper } from "../Mapper/aberrations.mapper";

/**
 * Contract snapshot for Aberrations summary column metadata.
 * GET /indore/revenue-protection/aberrations
 */
test.describe("Revenue Protection — Aberrations Contract Snapshot", () => {
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  test(
    "IND-RPT-ABE-CONTRACT-001 — Aberrations columns contract snapshot",
    {
      tag: ["@revenue-protection", "@aberrations", "@contract-snapshot"],
    },
    async ({ authenticatedApi }) => {
      await applyAllureTestCaseId("IND-RPT-ABE-CONTRACT-001");

      const api = new AberrationsApi(authenticatedApi);
      const validation = new ValidationEngine();
      const assert = new AssertionEngine();
      const { rawResponse, responseBody, responseTime } =
        await api.getAberrationSummary(aberrationsDefaultQuery);
      const mapped = AberrationsMapper.mapData(responseBody.data);

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );

      const rowFieldKeys =
        mapped.rows[0] !== undefined
          ? Object.keys(mapped.rows[0]).filter((key) => key !== "id")
          : mapped.columns.map((column) => column.key);

      await assertContractSnapshot(
        "revenue-protection/aberrations-columns",
        buildGridContractSnapshot({
          columns: mapped.columns,
          rowFieldKeys,
        }),
      );

      validation.printSummary(
        "IND-RPT-ABE-CONTRACT-001 — Aberrations columns contract snapshot",
        responseTime,
      );
    },
  );
});
