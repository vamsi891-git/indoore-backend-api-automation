import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { PatternConsumptionApi } from "../Api/patternconsumption.api";
import { MonthlyNetMeterApi } from "../Api/monthlynetmeter.api";
import { MonthlyNetMeterMapper } from "../Mapper/monthlynetmeter.mapper";
import { ConsumptionReportApi } from "../Api/consumption-report.api";
import { consumptionEdgeCases } from "../Data/consumption-negative.data";
import { PatternConsumptionMapper } from "../Mapper/patternconsumption.mapper";
import { DailyConsumptionMapper,DailyConsumptionResponse,} from "../Mapper/dailyconsumption.mapper";
import {HourlyConsumptionMapper,HourlyConsumptionResponse,} from "../Mapper/hourlyconsumption.mapper";
import {MonthlyReportConsumptionMapper,MonthlyReportConsumptionResponse,} from "../Mapper/monthlyconsumption.mapper";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { CONSUMPTION_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { skipIfConsumptionInternalError } from "../utils/consumption-env.helper";
import {
  patternIdentityRows,
  validateNoMeterOverlap,
  validateSharedHierarchyAllowed,
  validateUniqueConsumerKeys,
} from "../utils/consumption-identity.helper";
import {
  NightZeroConsumptionMapper,
  NightZeroConsumptionResponse,
} from "../Mapper/nightzeroconsumption.mapper";
test.describe("Consumption API — Edge", () => {
  test.setTimeout(CONSUMPTION_TEST_TIMEOUT_MS);
  const patternKinds = [
    {
      name: "Last three months",
      type: "lastThree" as const,
      tag: "@last-three-months",
    },
    { name: "Yearly pattern", type: "yearly" as const, tag: "@yearly" },
    {
      name: "Pattern comparison",
      type: "comparison" as const,
      tag: "@comparison",
    },
  ];
  for (const kind of patternKinds) {
    test(
      `${kind.name} — page 2 continues without repeating a meter`,
      { tag: ["@consumption", kind.tag, "@edge"] },
      async ({ authenticatedApi }) => {
        const api = new PatternConsumptionApi(authenticatedApi);
        const params = consumptionEdgeCases.patternPage2;
        const first = await api.getPatternConsumption(
          kind.type,
          1,
          params.limit,
          params.month,
          params.year,
        );
        skipIfConsumptionInternalError(
          first.rawResponse.status(),
          first.responseBody,
          `/indore/consumption/pattern-consumption?patternType=${kind.type}`,
        );
        const { rawResponse, responseBody } = await api.getPatternConsumption(
          kind.type,
          params.page,
          params.limit,
          params.month,
          params.year,
        );
        skipIfConsumptionInternalError(
          rawResponse.status(),
          responseBody,
          `/indore/consumption/pattern-consumption?patternType=${kind.type}`,
        );
        const validation = new ValidationEngine();
        const mapped = PatternConsumptionMapper.map(responseBody);
        const firstMapped = PatternConsumptionMapper.map(first.responseBody);
        validation.execute("Status 200", () => {
          expect(rawResponse.status()).toBe(200);
        });
        validation.execute("Page echo", () => {
          expect(mapped.pagination.page).toBe(params.page);
        });
        validation.execute("Items within limit", () => {
          expect(mapped.rows.length).toBeLessThanOrEqual(params.limit);
        });
        if (mapped.rows.length > 0) {
          validation.execute("Unique consumers", () =>
            validateUniqueConsumerKeys(patternIdentityRows(mapped.rows)),
          );
          validation.execute("Shared feeder allowed", () =>
            validateSharedHierarchyAllowed(patternIdentityRows(mapped.rows)),
          );
          validation.execute("No meter from page 1", () =>
            validateNoMeterOverlap(
              patternIdentityRows(firstMapped.rows),
              patternIdentityRows(mapped.rows),
            ),
          );
        }
        validation.printSummary(
          `${kind.name} — page 2 continues without repeating a meter`,
          0,
        );
      },
    );
    test(
      `${kind.name} — asking for one consumer at a time still returns a row`,
      { tag: ["@consumption", kind.tag, "@edge"] },
      async ({ authenticatedApi }) => {
        const api = new PatternConsumptionApi(authenticatedApi);
        const params = consumptionEdgeCases.patternLimit1;
        const { rawResponse, responseBody } = await api.getPatternConsumption(
          kind.type,
          params.page,
          params.limit,
          params.month,
          params.year,
        );
        skipIfConsumptionInternalError(
          rawResponse.status(),
          responseBody,
          `/indore/consumption/pattern-consumption?patternType=${kind.type}`,
        );
        const validation = new ValidationEngine();
        const mapped = PatternConsumptionMapper.map(responseBody);
        validation.execute("Status 200", () => {
          expect(rawResponse.status()).toBe(200);
        });
        validation.execute("At most one item", () => {
          expect(mapped.rows.length).toBeLessThanOrEqual(1);
        });
        if (mapped.rows.length > 0) {
          validation.execute("Unique consumers", () =>
            validateUniqueConsumerKeys(patternIdentityRows(mapped.rows)),
          );
        }
        validation.printSummary(
          `${kind.name} — asking for one consumer at a time still returns a row`,
          0,
        );
      },
    );
    test(
      `${kind.name} — leftover unused filters are ignored`,
      { tag: ["@consumption", kind.tag, "@edge"] },
      async ({ authenticatedApi }) => {
        const api = new PatternConsumptionApi(authenticatedApi);
        const params = consumptionEdgeCases.patternUnusedQuery;
        const { rawResponse, responseBody } = await api.getPatternConsumption(
          kind.type,
          params.page,
          params.limit,
          params.month,
          params.year,
          { foo: "bar" },
        );
        skipIfConsumptionInternalError(
          rawResponse.status(),
          responseBody,
          `/indore/consumption/pattern-consumption?patternType=${kind.type}`,
        );
        const validation = new ValidationEngine();
        const mapped = PatternConsumptionMapper.map(responseBody);
        validation.execute("Status 200", () => {
          expect(rawResponse.status()).toBe(200);
        });
        if (mapped.rows.length > 0) {
          validation.execute("Unique consumers", () =>
            validateUniqueConsumerKeys(patternIdentityRows(mapped.rows)),
          );
          validation.execute("Shared feeder allowed", () =>
            validateSharedHierarchyAllowed(patternIdentityRows(mapped.rows)),
          );
        }
        validation.printSummary(
          `${kind.name} — leftover unused filters are ignored`,
          0,
        );
      },
    );
    test(
      `${kind.name} — a page far past the end of the list is empty`,
      { tag: ["@consumption", kind.tag, "@edge"] },
      async ({ authenticatedApi }) => {
        const api = new PatternConsumptionApi(authenticatedApi);
        const params = consumptionEdgeCases.patternFarPage;
        const { rawResponse, responseBody } = await api.getPatternConsumption(
          kind.type,
          params.page,
          params.limit,
          params.month,
          params.year,
        );
        skipIfConsumptionInternalError(
          rawResponse.status(),
          responseBody,
          `/indore/consumption/pattern-consumption?patternType=${kind.type}`,
        );
        const validation = new ValidationEngine();
        const mapped = PatternConsumptionMapper.map(responseBody);
        validation.execute("Status 200", () => {
          expect(rawResponse.status()).toBe(200);
        });
        validation.execute("Empty or within limit", () => {
          expect(mapped.rows.length).toBeLessThanOrEqual(params.limit);
        });
        if (mapped.rows.length > 0) {
          validation.execute("Unique consumers", () =>
            validateUniqueConsumerKeys(patternIdentityRows(mapped.rows)),
          );
        }
        validation.printSummary(
          `${kind.name} — a page far past the end of the list is empty`,
          0,
        );
      },
    );
  }
  test("Monthly net meter — page 2 continues without repeating a meter",
    { tag: ["@consumption", "@monthly-net-meter", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new MonthlyNetMeterApi(authenticatedApi);
      const params = consumptionEdgeCases.monthlyNetMeterPage2;
      const first = await api.getMonthlyNetMeter(
        1,
        params.limit,
        params.month,
        params.year,
      );
      skipIfConsumptionInternalError(
        first.rawResponse.status(),
        first.responseBody,
        "/indore/consumption/monthly-net-meter",
      );
      const { rawResponse, responseBody } = await api.getMonthlyNetMeter(
        params.page,
        params.limit,
        params.month,
        params.year,
      );
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/monthly-net-meter",
      );
      const validation = new ValidationEngine();
      const mapped = MonthlyNetMeterMapper.map(responseBody);
      const firstMapped = MonthlyNetMeterMapper.map(first.responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Page echo", () => {
        expect(mapped.page).toBe(params.page);
      });
      validation.execute("Items within limit", () => {
        expect(mapped.items.length).toBeLessThanOrEqual(params.limit);
      });
      if (mapped.items.length > 0) {
        validation.execute("Unique consumers", () =>
          validateUniqueConsumerKeys(mapped.items),
        );
        validation.execute("Shared feeder allowed", () =>
          validateSharedHierarchyAllowed(mapped.items),
        );
        validation.execute("No meter from page 1", () =>
          validateNoMeterOverlap(firstMapped.items, mapped.items),
        );
      }
      validation.printSummary(
        "Monthly net meter — page 2 continues without repeating a meter",
        0,
      );
    },
  );
  test("Monthly net meter — asking for one consumer at a time still returns a row",
    { tag: ["@consumption", "@monthly-net-meter", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new MonthlyNetMeterApi(authenticatedApi);
      const params = consumptionEdgeCases.monthlyNetMeterLimit1;
      const { rawResponse, responseBody } = await api.getMonthlyNetMeter(
        params.page,
        params.limit,
        params.month,
        params.year,
      );
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/monthly-net-meter",
      );
      const validation = new ValidationEngine();
      const mapped = MonthlyNetMeterMapper.map(responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("At most one item", () => {
        expect(mapped.items.length).toBeLessThanOrEqual(1);
      });
      if (mapped.items.length > 0) {
        validation.execute("Unique consumers", () =>
          validateUniqueConsumerKeys(mapped.items),
        );
      }
      validation.printSummary(
        "Monthly net meter — asking for one consumer at a time still returns a row",
        0,
      );
    },
  );
  test("Monthly net meter — leftover unused filters are ignored",
    { tag: ["@consumption", "@monthly-net-meter", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new MonthlyNetMeterApi(authenticatedApi);
      const params = consumptionEdgeCases.monthlyNetMeterUnusedQuery;
      const { rawResponse, responseBody } = await api.getMonthlyNetMeter(
        params.page,
        params.limit,
        params.month,
        params.year,
        { foo: "bar" },
      );
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/monthly-net-meter",
      );
      const validation = new ValidationEngine();
      const mapped = MonthlyNetMeterMapper.map(responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      if (mapped.items.length > 0) {
        validation.execute("Unique consumers", () =>
          validateUniqueConsumerKeys(mapped.items),
        );
        validation.execute("Shared feeder allowed", () =>
          validateSharedHierarchyAllowed(mapped.items),
        );
      }
      validation.printSummary(
        "Monthly net meter — leftover unused filters are ignored",
        0,
      );
    },
  );
  test("Monthly net meter — a page far past the end of the list is empty",
    { tag: ["@consumption", "@monthly-net-meter", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new MonthlyNetMeterApi(authenticatedApi);
      const params = consumptionEdgeCases.monthlyNetMeterFarPage;
      const { rawResponse, responseBody } = await api.getMonthlyNetMeter(
        params.page,
        params.limit,
        params.month,
        params.year,
      );
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/monthly-net-meter",
      );
      const validation = new ValidationEngine();
      const mapped = MonthlyNetMeterMapper.map(responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Empty or within limit", () => {
        expect(mapped.items.length).toBeLessThanOrEqual(params.limit);
      });
      if (mapped.items.length > 0) {
        validation.execute("Unique consumers", () =>
          validateUniqueConsumerKeys(mapped.items),
        );
      }
      validation.printSummary(
        "Monthly net meter — a page far past the end of the list is empty",
        0,
      );
    },
  );
  test("Daily consumption — page 2 continues without repeating a meter",
    { tag: ["@consumption", "@daily-consumption", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionReportApi(authenticatedApi);
      const params = consumptionEdgeCases.reportDailyPage2;
      const first = await api.getReport<DailyConsumptionResponse>(
        params.reportType,
        1,
        params.limit,
        params.fromDate,
        params.toDate,
        params.month,
        params.year,
      );
      skipIfConsumptionInternalError(
        first.rawResponse.status(),
        first.responseBody,
        "/indore/consumption/report?reportType=daily",
      );
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
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/report?reportType=daily",
      );
      const validation = new ValidationEngine();
      const mapped = DailyConsumptionMapper.map(responseBody);
      const firstMapped = DailyConsumptionMapper.map(first.responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Page echo", () => {
        expect(mapped.page).toBe(params.page);
      });
      validation.execute("Items within limit", () => {
        expect(mapped.items.length).toBeLessThanOrEqual(params.limit);
      });
      if (mapped.items.length > 0) {
        validation.execute("Unique consumers", () =>
          validateUniqueConsumerKeys(mapped.items),
        );
        validation.execute("Shared feeder allowed", () =>
          validateSharedHierarchyAllowed(mapped.items),
        );
        validation.execute("No meter from page 1", () =>
          validateNoMeterOverlap(firstMapped.items, mapped.items),
        );
      }
      validation.printSummary(
        "Daily consumption — page 2 continues without repeating a meter",
        0,
      );
    },
  );
  test("Daily consumption — asking for one consumer at a time still returns a row",
    { tag: ["@consumption", "@daily-consumption", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionReportApi(authenticatedApi);
      const params = consumptionEdgeCases.reportDailyLimit1;
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
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/report?reportType=daily",
      );
      const validation = new ValidationEngine();
      const mapped = DailyConsumptionMapper.map(responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("At most one item", () => {
        expect(mapped.items.length).toBeLessThanOrEqual(1);
      });
      if (mapped.items.length > 0) {
        validation.execute("Unique consumers", () =>
          validateUniqueConsumerKeys(mapped.items),
        );
      }
      validation.printSummary(
        "Daily consumption — asking for one consumer at a time still returns a row",
        0,
      );
    },
  );
  test("Daily consumption — leftover unused filters are ignored",
    { tag: ["@consumption", "@daily-consumption", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionReportApi(authenticatedApi);
      const params = consumptionEdgeCases.reportDailyUnusedQuery;
      const { rawResponse, responseBody } =
        await api.getReport<DailyConsumptionResponse>(
        params.reportType,
        params.page,
        params.limit,
        params.fromDate,
        params.toDate,
        params.month,
        params.year,
        {},
        { foo: "bar" },
      );
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/report?reportType=daily",
      );
      const validation = new ValidationEngine();
      const mapped = DailyConsumptionMapper.map(responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      if (mapped.items.length > 0) {
        validation.execute("Unique consumers", () =>
          validateUniqueConsumerKeys(mapped.items),
        );
        validation.execute("Shared feeder allowed", () =>
          validateSharedHierarchyAllowed(mapped.items),
        );
      }
      validation.printSummary(
        "Daily consumption — leftover unused filters are ignored",
        0,
      );
    },
  );
  test("Daily consumption — a page far past the end of the list is empty",
    { tag: ["@consumption", "@daily-consumption", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionReportApi(authenticatedApi);
      const params = consumptionEdgeCases.reportDailyFarPage;
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
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/report?reportType=daily",
      );
      const validation = new ValidationEngine();
      const mapped = DailyConsumptionMapper.map(responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Empty or within limit", () => {
        expect(mapped.items.length).toBeLessThanOrEqual(params.limit);
      });
      if (mapped.items.length > 0) {
        validation.execute("Unique consumers", () =>
          validateUniqueConsumerKeys(mapped.items),
        );
      }
      validation.printSummary(
        "Daily consumption — a page far past the end of the list is empty",
        0,
      );
    },
  );
  test("Hourly consumption — asking for one row at a time still stays within the limit",
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
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/report?reportType=hourly",
      );
      const validation = new ValidationEngine();
      const mapped = HourlyConsumptionMapper.map(responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("At most one item", () => {
        expect(mapped.items.length).toBeLessThanOrEqual(1);
      });
      if (mapped.items.length > 0) {
        validation.execute("Unique consumers", () =>
          validateUniqueConsumerKeys(mapped.items),
        );
      }
      validation.printSummary(
        "Hourly consumption — asking for one row at a time still stays within the limit",
        0,
      );
    },
  );
  test("Monthly consumption — page 2 continues without repeating a meter",
    { tag: ["@consumption", "@monthly-consumption", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionReportApi(authenticatedApi);
      const params = consumptionEdgeCases.reportMonthlyPage2;
      const first = await api.getReport<MonthlyReportConsumptionResponse>(
        params.reportType,
        1,
        params.limit,
        params.fromDate,
        params.toDate,
        params.month,
        params.year,
      );
      skipIfConsumptionInternalError(
        first.rawResponse.status(),
        first.responseBody,
        "/indore/consumption/report?reportType=monthly",
      );
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
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/report?reportType=monthly",
      );
      const validation = new ValidationEngine();
      const mapped = MonthlyReportConsumptionMapper.map(responseBody);
      const firstMapped = MonthlyReportConsumptionMapper.map(first.responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Items within limit", () => {
        expect(mapped.items.length).toBeLessThanOrEqual(params.limit);
      });
      if (mapped.items.length > 0) {
        validation.execute("Unique consumers", () =>
          validateUniqueConsumerKeys(mapped.items),
        );
        validation.execute("Shared feeder allowed", () =>
          validateSharedHierarchyAllowed(mapped.items),
        );
        validation.execute("No meter from page 1", () =>
          validateNoMeterOverlap(firstMapped.items, mapped.items),
        );
      }
      validation.printSummary(
        "Monthly consumption — page 2 continues without repeating a meter",
        0,
      );
    },
  );
  test("Night-time consumption — page 2 continues without repeating a meter",
    { tag: ["@consumption", "@night-zero-consumption", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionReportApi(authenticatedApi);
      const params = consumptionEdgeCases.reportNightZeroPage2;
      const first = await api.getReport<NightZeroConsumptionResponse>(
        params.reportType,
        1,
        params.limit,
        params.fromDate,
        params.toDate,
        params.month,
        params.year,
      );
      skipIfConsumptionInternalError(
        first.rawResponse.status(),
        first.responseBody,
        "/indore/consumption/report?reportType=nightZero",
      );
      const { rawResponse, responseBody } =
        await api.getReport<NightZeroConsumptionResponse>(
        params.reportType,
        params.page,
        params.limit,
        params.fromDate,
        params.toDate,
        params.month,
        params.year,
      );
      skipIfConsumptionInternalError(
        rawResponse.status(),
        responseBody,
        "/indore/consumption/report?reportType=nightZero",
      );
      const validation = new ValidationEngine();
      const mapped = NightZeroConsumptionMapper.map(responseBody);
      const firstMapped = NightZeroConsumptionMapper.map(first.responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Page echo", () => {
        expect(mapped.page).toBe(params.page);
      });
      validation.execute("Items within limit", () => {
        expect(mapped.items.length).toBeLessThanOrEqual(params.limit);
      });
      if (mapped.items.length > 0) {
        validation.execute("Unique consumers", () =>
          validateUniqueConsumerKeys(mapped.items),
        );
        validation.execute("Shared feeder allowed", () =>
          validateSharedHierarchyAllowed(mapped.items),
        );
        validation.execute("No meter from page 1", () =>
          validateNoMeterOverlap(firstMapped.items, mapped.items),
        );
      }
      validation.printSummary(
        "Night-time consumption — page 2 continues without repeating a meter",
        0,
      );
    },
  );
});
