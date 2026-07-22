import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import {
  assertContractSnapshot,
  buildGridContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { AtrZoneApi } from "../Api/atr-zone.api";
import { atrZoneDefaultQuery } from "../Data/atr-zone.data";
import { AtrZoneMapper } from "../Mapper/atr-zone.mapper";

/**
 * Contract snapshot for ATR Zone column metadata.
 *
 * Failure means the backend contract changed (header rename, reorder, or key drift).
 * Confirm intentional, then:
 *   UPDATE_CONTRACT_SNAPSHOTS=true npx playwright test atr-zone.contract.spec.ts
 */
test.describe("Revenue Protection — ATR Zone Contract Snapshot", () => {
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  test(
    "IND-RPT-ATZ-CONTRACT-001 — ATR Zone columns contract snapshot",
    {
      tag: ["@revenue-protection", "@atr-zone", "@contract-snapshot"],
    },
    async ({ authenticatedApi }) => {
      await applyAllureTestCaseId("IND-RPT-ATZ-CONTRACT-001");

      const api = new AtrZoneApi(authenticatedApi);
      const validation = new ValidationEngine();
      const assert = new AssertionEngine();
      const { rawResponse, responseBody, responseTime } =
        await api.getAtrZone(atrZoneDefaultQuery);
      const mapped = AtrZoneMapper.mapData(responseBody.data);

      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200, responseBody),
      );

      const rowFieldKeys =
        mapped.rows[0] !== undefined
          ? Object.keys(mapped.rows[0]).filter((key) => key !== "id")
          : mapped.columns.map((column) => column.key);

      const snapshot = buildGridContractSnapshot({
        columns: mapped.columns,
        rowFieldKeys,
      });

      await assertContractSnapshot(
        "revenue-protection/atr-zone-columns",
        snapshot,
      );

      validation.printSummary(
        "IND-RPT-ATZ-CONTRACT-001 — ATR Zone columns contract snapshot",
        responseTime,
      );
    },
  );
});
