import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { REVENUE_PROTECTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { applyAllureTestCaseId } from "../../../core/utils/allure-test-case.helper";
import { AtrSummaryApi } from "../Api/atr-summary.api";
import { ATR_SUMMARY_MONTH, ATR_SUMMARY_YEAR } from "../Data/atr-summary.data";
import { AtrSummaryMapper } from "../Mapper/atr-summary.mapper";
import { AtrSummaryValidator } from "../Validator/atr-summary.validator";

/**
 * Child unitsGain must sum to the selected parent row / response totals.
 * Tagged @consistency — not in default atr-summary smoke script.
 */
test.describe("Revenue Protection — ATR Summary unitsGain consistency", () => {
  test.describe.configure({ retries: 0, mode: "serial" });
  test.setTimeout(REVENUE_PROTECTION_TEST_TIMEOUT_MS);

  test(
    `billingEfficiency unitsGain child-sum === parent (${ATR_SUMMARY_YEAR}-${String(ATR_SUMMARY_MONTH).padStart(2, "0")})`,
    {
      tag: [
        "@consistency",
        "@atr-summary",
        "@atr-summary-billingEfficiency",
        "@atr-summary-unitsGain",
      ],
    },
    async ({ authenticatedApi }) => {
      await applyAllureTestCaseId("IND-REV-ATR-SUM-BE-UNITS");
      const api = new AtrSummaryApi(authenticatedApi);
      const validator = new AtrSummaryValidator();

      const circleRes = await api.getAtrSummary({
        year: ATR_SUMMARY_YEAR,
        reportType: "billingEfficiency",
        hierarchyLevel: "circle",
        month: ATR_SUMMARY_MONTH,
        page: 1,
        limit: 20,
      });
      expect(circleRes.rawResponse.status()).toBe(200);
      const circle = AtrSummaryMapper.mapData(circleRes.responseBody.data);
      expect(circle.rows.length).toBeGreaterThan(0);
      const circleRow = circle.rows[0];
      const circleId = String(circleRow.hierarchyId ?? circleRow.circleId);

      const divisionRes = await api.getAtrSummary({
        year: ATR_SUMMARY_YEAR,
        reportType: "billingEfficiency",
        hierarchyLevel: "division",
        month: String(ATR_SUMMARY_MONTH).padStart(2, "0"),
        parentId: circleId,
        circleId,
        page: 1,
        limit: 20,
      });
      expect(divisionRes.rawResponse.status()).toBe(200);
      const division = AtrSummaryMapper.mapData(divisionRes.responseBody.data);
      validator.validateExpectedDivisions(division);
      // Division-list totals echo the circle parent.
      validator.validateUnitsGainChildSum(
        circle.totals?.unitsGain,
        division.rows,
        "circle→division (totals)",
      );
      validator.validateUnitsGainChildSum(
        Number(circleRow.unitsGain),
        division.rows,
        "circle→division (row)",
      );

      const central = division.rows.find((row) => String(row.division).toUpperCase() === "CENTRAL");
      expect(central, "CENTRAL division").toBeDefined();
      const divisionId = String(central!.hierarchyId ?? central!.divisionId);

      const zoneRes = await api.getAtrSummary({
        year: ATR_SUMMARY_YEAR,
        reportType: "billingEfficiency",
        hierarchyLevel: "zone",
        month: String(ATR_SUMMARY_MONTH).padStart(2, "0"),
        parentId: divisionId,
        circleId,
        divisionId,
        page: 1,
        limit: 20,
      });
      expect(zoneRes.rawResponse.status()).toBe(200);
      const zone = AtrSummaryMapper.mapData(zoneRes.responseBody.data);
      expect(zone.rows.length).toBeGreaterThan(0);
      // Zone-list totals echo the selected division (CENTRAL), not all divisions.
      validator.validateUnitsGainChildSum(
        zone.totals?.unitsGain,
        zone.rows,
        "division→zone (totals)",
      );
      validator.validateUnitsGainChildSum(
        Number(central!.unitsGain),
        zone.rows,
        "division→zone (row)",
      );

      const zoneRow = zone.rows[0];
      const zoneId = String(zoneRow.hierarchyId ?? zoneRow.zoneId);

      const feederRes = await api.getAtrSummary({
        year: ATR_SUMMARY_YEAR,
        reportType: "billingEfficiency",
        hierarchyLevel: "feeder",
        month: String(ATR_SUMMARY_MONTH).padStart(2, "0"),
        parentId: zoneId,
        circleId,
        divisionId,
        zoneId,
        page: 1,
        limit: 20,
      });
      expect(feederRes.rawResponse.status()).toBe(200);
      const feeder = AtrSummaryMapper.mapData(feederRes.responseBody.data);
      expect(feeder.rows.length).toBeGreaterThan(0);
      // Feeder totals are null — compare to selected zone row unitsGain.
      validator.validateUnitsGainChildSum(
        Number(zoneRow.unitsGain),
        feeder.rows,
        "zone→feeder (row)",
      );
    },
  );
});
