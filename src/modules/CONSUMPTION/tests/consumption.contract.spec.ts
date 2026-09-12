import { test, expect } from "../../../fixtures/observability.fixture";
import {
  assertContractSnapshot,
  buildLookupItemsContractSnapshot,
} from "../../../core/contract/contract-snapshot.helper";
import { DailyConsumptionApi } from "../Api/dailyconsumption.api";
import { dailyConsumptionData } from "../Data/dailyconsumption.data";
import { ConsumptionReportApi } from "../Api/consumption-report.api";
import { hourlyConsumptionData } from "../Data/hourlyconsumption.data";
import { monthlyReportConsumptionData } from "../Data/monthlyconsumption.data";
import { nightZeroConsumptionData } from "../Data/nightzeroconsumption.data";
import { MonthlyNetMeterApi } from "../Api/monthlynetmeter.api";
import { monthlyNetMeterData } from "../Data/monthlynetmeter.data";
import { PatternConsumptionApi } from "../Api/patternconsumption.api";
import { patternConsumptionData } from "../Data/patternconsumption.data";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function itemKeysFromData(data: Record<string, unknown>): string[] {
  const table = asRecord(data.table);
  const rows = Array.isArray(table.rows)
    ? table.rows
    : Array.isArray(data.rows)
      ? data.rows
      : Array.isArray(data.items)
        ? data.items
        : [];
  return rows.length > 0 ? Object.keys(asRecord(rows[0])).sort() : [];
}

function columnsFromTable(data: Record<string, unknown>): Array<{
  key: string;
  header: string;
}> {
  const table = asRecord(data.table);
  const columns = Array.isArray(table.columns) ? table.columns : [];
  return columns.map((column) => {
    const col = asRecord(column);
    return {
      key: String(col.key ?? ""),
      header: String(col.label ?? col.header ?? ""),
    };
  });
}

test.describe("CONSUMPTION — Contract Snapshots", () => {
  test.setTimeout(180_000);

  test(
    "Daily Consumption Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumption"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } = await new DailyConsumptionApi(
        authenticatedApi,
      ).getDailyReport(
        dailyConsumptionData.page,
        dailyConsumptionData.limit,
        dailyConsumptionData.fromDate,
        dailyConsumptionData.toDate,
        dailyConsumptionData.month,
        dailyConsumptionData.year,
      );
      expect(rawResponse.status()).toBe(200);
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "consumption/daily-consumption",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/consumption/report",
          dataKeys: Object.keys(data).sort(),
          itemKeys: itemKeysFromData(data),
        }),
      );
    },
  );

  test(
    "Hourly Consumption Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumption"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } = await new ConsumptionReportApi(
        authenticatedApi,
      ).getReport(
        "hourly",
        hourlyConsumptionData.page,
        hourlyConsumptionData.limit,
        hourlyConsumptionData.fromDate,
        hourlyConsumptionData.toDate,
        hourlyConsumptionData.month,
        hourlyConsumptionData.year,
      );
      expect(rawResponse.status()).toBe(200);
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      const hourlyItemKeys = itemKeysFromData(data);
      if (hourlyItemKeys.length === 0) {
        test.skip(
          true,
          "Hourly consumption returned no items for snapshot window — skip contract capture",
        );
        return;
      }
      await assertContractSnapshot(
        "consumption/hourly-consumption",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/consumption/report",
          dataKeys: Object.keys(data).sort(),
          itemKeys: hourlyItemKeys,
        }),
      );
    },
  );

  test(
    "Monthly Consumption Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumption"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } = await new ConsumptionReportApi(
        authenticatedApi,
      ).getReport(
        "monthly",
        monthlyReportConsumptionData.page,
        monthlyReportConsumptionData.limit,
        monthlyReportConsumptionData.fromDate,
        monthlyReportConsumptionData.toDate,
        monthlyReportConsumptionData.month,
        monthlyReportConsumptionData.year,
      );
      expect(rawResponse.status()).toBe(200);
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "consumption/monthly-consumption",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/consumption/report",
          dataKeys: Object.keys(data).sort(),
          itemKeys: itemKeysFromData(data),
        }),
      );
    },
  );

  test(
    "Night-Zero Consumption Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumption"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } = await new ConsumptionReportApi(
        authenticatedApi,
      ).getReport(
        "nightZero",
        nightZeroConsumptionData.page,
        nightZeroConsumptionData.limit,
        nightZeroConsumptionData.fromDate,
        nightZeroConsumptionData.toDate,
        nightZeroConsumptionData.month,
        nightZeroConsumptionData.year,
      );
      expect(rawResponse.status()).toBe(200);
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "consumption/night-zero-consumption",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/consumption/report",
          dataKeys: Object.keys(data).sort(),
          itemKeys: itemKeysFromData(data),
        }),
      );
    },
  );

  test(
    "Monthly Net Meter Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumption"] },
    async ({ authenticatedApi }) => {
      const { responseBody, rawResponse } = await new MonthlyNetMeterApi(
        authenticatedApi,
      ).getMonthlyNetMeter(
        monthlyNetMeterData.page,
        monthlyNetMeterData.limit,
        monthlyNetMeterData.month,
        monthlyNetMeterData.year,
      );
      expect(rawResponse.status()).toBe(200);
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "consumption/monthly-net-meter",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/consumption/monthly-net-meter",
          dataKeys: Object.keys(data).sort(),
          itemKeys: itemKeysFromData(data),
        }),
      );
    },
  );

  test(
    "Pattern Consumption Last Three Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumption", "@last-three-months"] },
    async ({ authenticatedApi }) => {
      const { page, limit, month, year, lastThreeMonthsType } =
        patternConsumptionData;
      const { responseBody, rawResponse } = await new PatternConsumptionApi(
        authenticatedApi,
      ).getPatternConsumption(lastThreeMonthsType, page, limit, month, year);
      expect(rawResponse.status()).toBe(200);
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "consumption/pattern-last-three",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/consumption/pattern-consumption",
          dataKeys: Object.keys(data).sort(),
          itemKeys: itemKeysFromData(data),
          hasColumnsGrid: true,
          columns: columnsFromTable(data),
        }),
      );
    },
  );

  test(
    "Pattern Consumption Yearly Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumption", "@yearly"] },
    async ({ authenticatedApi }) => {
      const { page, limit, month, year, yearlyType } = patternConsumptionData;
      const { responseBody, rawResponse } = await new PatternConsumptionApi(
        authenticatedApi,
      ).getPatternConsumption(yearlyType, page, limit, month, year);
      expect(rawResponse.status()).toBe(200);
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "consumption/pattern-yearly",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/consumption/pattern-consumption",
          dataKeys: Object.keys(data).sort(),
          itemKeys: itemKeysFromData(data),
          hasColumnsGrid: true,
          columns: columnsFromTable(data),
        }),
      );
    },
  );

  test(
    "Pattern Consumption Comparison Contract Snapshot",
    { tag: ["@contract-snapshot", "@consumption", "@comparison"] },
    async ({ authenticatedApi }) => {
      const { page, limit, month, year, comparisonType } =
        patternConsumptionData;
      const { responseBody, rawResponse } = await new PatternConsumptionApi(
        authenticatedApi,
      ).getPatternConsumption(comparisonType, page, limit, month, year);
      expect(rawResponse.status()).toBe(200);
      const body = asRecord(responseBody);
      expect(body.success).toBe(true);
      const data = asRecord(body.data);
      await assertContractSnapshot(
        "consumption/pattern-comparison",
        buildLookupItemsContractSnapshot({
          pathPattern: "/indore/consumption/pattern-consumption",
          dataKeys: Object.keys(data).sort(),
          itemKeys: itemKeysFromData(data),
          hasColumnsGrid: true,
          columns: columnsFromTable(data),
        }),
      );
    },
  );
});
