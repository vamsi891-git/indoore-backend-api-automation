import { expect } from "@playwright/test";
import type {
  MappedReportsOverview,
  ReportsOverviewErrorBody,
  ReportsOverviewKpi,
  ReportsOverviewPeriod,
  ReportsOverviewResponse,
  ReportsOverviewScenario,
} from "../Mapper/overview.mapper";
import {
  reportsOverviewKpiFieldKeys,
  reportsOverviewKpiKeys,
} from "../Mapper/overview.mapper";

const ISO_INSTANT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const TREND_DIRECTIONS = ["up", "down", "flat"] as const;

function expectedTrend(
  current: number,
  previous: number,
): (typeof TREND_DIRECTIONS)[number] {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

export class ReportsOverviewValidator {
  validateResponseEnvelope(response: ReportsOverviewResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateValidationError(responseBody: ReportsOverviewErrorBody): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error?.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error?.message).toBeTruthy();
  }

  validateSuccess(mapped: MappedReportsOverview): void {
    expect(mapped.success).toBeTruthy();
  }

  validateRootStructure(mapped: MappedReportsOverview): void {
    for (const key of reportsOverviewKpiKeys) {
      expect(mapped[key]).not.toBeNull();
    }
    expect(mapped.currentPeriod).not.toBeNull();
    expect(mapped.comparisonPeriod).not.toBeNull();
  }

  /**
   * Zero current/previous with available=true is valid (not “no data”).
   */
  validateKpi(kpi: ReportsOverviewKpi | null, label: string): void {
    expect(kpi, `${label} KPI missing`).not.toBeNull();
    const card = kpi!;
    expect(typeof card.currentValue).toBe("number");
    expect(typeof card.previousValue).toBe("number");
    expect(typeof card.percentageChange).toBe("number");
    expect(typeof card.trendDirection).toBe("string");
    expect(typeof card.comparisonAvailable).toBe("boolean");
    expect(typeof card.available).toBe("boolean");
    expect(card.currentValue).toBeGreaterThanOrEqual(0);
    expect(card.previousValue).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(card.currentValue)).toBeTruthy();
    expect(Number.isFinite(card.previousValue)).toBeTruthy();
    expect(Number.isFinite(card.percentageChange)).toBeTruthy();
    expect(TREND_DIRECTIONS).toContain(card.trendDirection);
    expect(card.trendDirection).toBe(
      expectedTrend(card.currentValue, card.previousValue),
    );
    if (card.currentValue === card.previousValue) {
      expect(card.percentageChange).toBe(0);
      expect(card.trendDirection).toBe("flat");
    }
    for (const field of reportsOverviewKpiFieldKeys) {
      expect(card).toHaveProperty(field);
    }
  }

  validateAllKpis(mapped: MappedReportsOverview): void {
    for (const key of reportsOverviewKpiKeys) {
      this.validateKpi(mapped[key], key);
    }
  }

  validatePeriod(period: ReportsOverviewPeriod | null, label: string): void {
    expect(period, `${label} missing`).not.toBeNull();
    const p = period!;
    expect(ISO_INSTANT.test(p.from)).toBeTruthy();
    expect(ISO_INSTANT.test(p.to)).toBeTruthy();
    expect(Date.parse(p.from)).toBeLessThan(Date.parse(p.to));
  }

  /**
   * Rolling windows: comparison period ends when current period starts.
   * Do not freeze absolute dates on live calls.
   */
  validatePeriodRelationship(mapped: MappedReportsOverview): void {
    this.validatePeriod(mapped.currentPeriod, "currentPeriod");
    this.validatePeriod(mapped.comparisonPeriod, "comparisonPeriod");
    const current = mapped.currentPeriod!;
    const comparison = mapped.comparisonPeriod!;
    expect(Date.parse(comparison.to)).toBe(Date.parse(current.from));
    expect(Date.parse(comparison.from)).toBeLessThan(
      Date.parse(comparison.to),
    );
  }

  validateLiveOk(mapped: MappedReportsOverview): void {
    this.validateSuccess(mapped);
    this.validateRootStructure(mapped);
    this.validateAllKpis(mapped);
    this.validatePeriodRelationship(mapped);
  }

  validateLiveZerosContract(mapped: MappedReportsOverview): void {
    this.validateLiveOk(mapped);
    for (const key of reportsOverviewKpiKeys) {
      const kpi = mapped[key]!;
      expect(kpi.currentValue).toBe(0);
      expect(kpi.previousValue).toBe(0);
      expect(kpi.percentageChange).toBe(0);
      expect(kpi.trendDirection).toBe("flat");
      expect(kpi.available).toBe(true);
      expect(kpi.comparisonAvailable).toBe(true);
    }
  }

  validateNonzeroTrendsContract(mapped: MappedReportsOverview): void {
    this.validateLiveOk(mapped);
    expect(mapped.successful?.trendDirection).toBe("up");
    expect(mapped.successful?.percentageChange).toBe(50);
    expect(mapped.scheduled?.trendDirection).toBe("down");
    expect(mapped.scheduled?.percentageChange).toBe(-50);
    expect(mapped.failed?.trendDirection).toBe("flat");
    expect(mapped.downloads?.currentValue).toBe(0);
  }

  validateScenario(
    mapped: MappedReportsOverview,
    scenario: ReportsOverviewScenario,
  ): void {
    switch (scenario) {
      case "contract_live_zeros":
        this.validateLiveZerosContract(mapped);
        break;
      case "contract_nonzero_trends":
        this.validateNonzeroTrendsContract(mapped);
        break;
      case "dev_live":
      case "dev_ignore_unknown_query":
        this.validateLiveOk(mapped);
        break;
      default:
        break;
    }
  }
}
