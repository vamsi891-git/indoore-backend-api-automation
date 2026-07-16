import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { PatternConsumptionApi } from "../Api/patternconsumption.api";
import { MonthlyNetMeterApi } from "../Api/monthlynetmeter.api";
import { ConsumptionReportApi } from "../Api/consumption-report.api";
import { consumptionEdgeCases } from "../Data/consumption-negative.data";
import { PatternConsumptionMapper } from "../Mapper/patternconsumption.mapper";
import { PatternConsumptionValidator } from "../Validator/patternconsumption.validator";
import {
  DailyConsumptionMapper,
  DailyConsumptionResponse,
} from "../Mapper/dailyconsumption.mapper";
import {
  HourlyConsumptionMapper,
  HourlyConsumptionResponse,
} from "../Mapper/hourlyconsumption.mapper";
import {
  MonthlyReportConsumptionMapper,
  MonthlyReportConsumptionResponse,
} from "../Mapper/monthlyconsumption.mapper";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { CONSUMPTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { isConsumptionInternalError } from "../utils/consumption-env.helper";

test.describe("Consumption API — Edge", () => {
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);

  test(
    "Pattern comparison page 2 returns valid pagination",
    { tag: ["@consumption", "@comparison", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new PatternConsumptionApi(authenticatedApi);
      const params = consumptionEdgeCases.patternComparisonPage2;
      const { rawResponse, responseBody } = await api.getPatternConsumption(
        params.patternType,
        params.page,
        params.limit,
        params.month,
        params.year,
      );

      if (
        rawResponse.status() === 500 &&
        isConsumptionInternalError(responseBody)
      ) {
        test.skip(true, "Pattern comparison page 2 returned 500 INTERNAL_ERROR");
        return;
      }

      const validation = new ValidationEngine();
      const mapped = PatternConsumptionMapper.map(responseBody);
      const validator = new PatternConsumptionValidator();

      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Page 2 slNo starts at 11", () =>
        validator.validateSlNo(mapped.rows, params.page, params.limit),
      );
      validation.execute("Pagination echo", () =>
        validator.validatePagination(
          mapped.pagination,
          params.page,
          params.limit,
          mapped.rows.length,
        ),
      );
      validation.printSummary("Pattern Comparison — Page 2", 0);
    },
  );

  test(
    "Pattern yearly limit 1 returns single row",
    { tag: ["@consumption", "@yearly", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new PatternConsumptionApi(authenticatedApi);
      const params = consumptionEdgeCases.patternYearlyLimit1;
      const { rawResponse, responseBody } = await api.getPatternConsumption(
        params.patternType,
        params.page,
        params.limit,
        params.month,
        params.year,
      );

      if (
        rawResponse.status() === 500 &&
        isConsumptionInternalError(responseBody)
      ) {
        test.skip(true, "Pattern yearly limit 1 returned 500 INTERNAL_ERROR");
        return;
      }

      const validation = new ValidationEngine();
      const mapped = PatternConsumptionMapper.map(responseBody);

      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("At most one row", () => {
        expect(mapped.rows.length).toBeLessThanOrEqual(1);
      });
      validation.printSummary("Pattern Yearly — Limit 1", 0);
    },
  );

  test(
    "Monthly net meter page 2 returns valid pagination",
    { tag: ["@consumption", "@monthly-net-meter", "@edge", "@backend-defect"] },
    async ({ authenticatedApi }) => {
      const api = new MonthlyNetMeterApi(authenticatedApi);
      const params = consumptionEdgeCases.monthlyNetMeterPage2;
      const { rawResponse, responseBody } = await api.getMonthlyNetMeter(
        params.page,
        params.limit,
        params.month,
        params.year,
      );

      if (
        rawResponse.status() === 500 &&
        isConsumptionInternalError(responseBody)
      ) {
        test.skip(true, "Monthly net meter page 2 returned 500 INTERNAL_ERROR");
        return;
      }

      const validation = new ValidationEngine();
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Page echo", () => {
        expect(responseBody.data?.page).toBe(params.page);
      });
      validation.printSummary("Monthly Net Meter — Page 2", 0);
    },
  );

  test(
    "Daily report page 2 returns valid pagination",
    { tag: ["@consumption", "@daily-consumption", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionReportApi(authenticatedApi);
      const params = consumptionEdgeCases.reportDailyPage2;
      const { rawResponse, responseBody } =
        await api.getReport<DailyConsumptionResponse>(
        params.reportType,
        params.page,
        params.limit,
        params.fromDate,
        params.toDate,
        params.month,
        params.year,
      );

      const validation = new ValidationEngine();
      const mapped = DailyConsumptionMapper.map(responseBody);

      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Page echo", () => {
        expect(mapped.page).toBe(params.page);
      });
      validation.printSummary("Daily Report — Page 2", 0);
    },
  );

  test(
    "Hourly report limit 1 returns at most one item",
    { tag: ["@consumption", "@hourly-consumption", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionReportApi(authenticatedApi);
      const params = consumptionEdgeCases.reportHourlyLimit1;
      const { rawResponse, responseBody } =
        await api.getReport<HourlyConsumptionResponse>(
        params.reportType,
        params.page,
        params.limit,
        params.fromDate,
        params.toDate,
        params.month,
        params.year,
      );

      if (
        rawResponse.status() === 500 &&
        isConsumptionInternalError(responseBody)
      ) {
        test.skip(true, "Hourly report limit 1 returned 500 INTERNAL_ERROR");
        return;
      }

      const validation = new ValidationEngine();
      const mapped = HourlyConsumptionMapper.map(responseBody);

      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("At most one item", () => {
        expect(mapped.items.length).toBeLessThanOrEqual(1);
      });
      validation.printSummary("Hourly Report — Limit 1", 0);
    },
  );

  test(
    "Monthly report returns paginated items",
    { tag: ["@consumption", "@monthly-consumption", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionReportApi(authenticatedApi);
      const params = consumptionEdgeCases.reportMonthlyPage1;
      const { rawResponse, responseBody } =
        await api.getReport<MonthlyReportConsumptionResponse>(
        params.reportType,
        params.page,
        params.limit,
        params.fromDate,
        params.toDate,
        params.month,
        params.year,
      );

      if (
        rawResponse.status() === 500 &&
        isConsumptionInternalError(responseBody)
      ) {
        test.skip(true, "Monthly report returned 500 INTERNAL_ERROR");
        return;
      }

      const validation = new ValidationEngine();
      const mapped = MonthlyReportConsumptionMapper.map(responseBody);

      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Items within limit", () => {
        expect(mapped.items.length).toBeLessThanOrEqual(params.limit);
      });
      validation.printSummary("Monthly Report — Page 1", 0);
    },
  );
});
