import { expect } from "@playwright/test";
import {
  OVERALL_METRICS_CHART_KEYS,
  OVERALL_METRICS_DONUT_KEYS,
  OVERALL_METRICS_KPI_KEYS,
} from "../Data/dashboardmetrics.data";
import type {
  DashboardMetricsResponse,
  MappedOverallMetrics,
  OverallChartData,
  OverallKpiCard,
  OverallLabeledValue,
  OverallMetricsData,
  OverallMetricsScenario,
} from "../Mapper/dashboardmetrics.mapper";

export class DashboardMetricsValidator {
  validateResponseEnvelope(response: DashboardMetricsResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeTruthy();
  }

  validateKpiCard(card: OverallKpiCard, label: string): void {
    expect(card.value, `${label}.value`).toBeTruthy();
    expect(typeof card.footerDelta, `${label}.footerDelta`).toBe("number");
    expect(Number.isFinite(card.footerDelta), `${label}.footerDelta finite`).toBe(
      true,
    );
    expect(Array.isArray(card.sparklineData), `${label}.sparklineData`).toBe(
      true,
    );
    for (const point of card.sparklineData) {
      expect(Number.isFinite(point), `${label}.sparkline point`).toBe(true);
    }
  }

  validateAllKpiCards(data: OverallMetricsData): void {
    for (const key of OVERALL_METRICS_KPI_KEYS) {
      this.validateKpiCard(data[key], key);
    }
  }

  validateLabeledValues(
    items: OverallLabeledValue[],
    section: string,
    options: { requireNonEmpty?: boolean; percentSumNear100?: boolean } = {},
  ): void {
    if (options.requireNonEmpty) {
      expect(items.length, `${section} length`).toBeGreaterThan(0);
    }
    for (const item of items) {
      expect(item.label, `${section}.label`).toBeTruthy();
      expect(item.value, `${section}.value`).toBeGreaterThanOrEqual(0);
      expect(item.percent, `${section}.percent`).toBeGreaterThanOrEqual(0);
    }
    if (options.percentSumNear100 && items.length > 0) {
      const sum = items.reduce((acc, item) => acc + item.percent, 0);
      expect(Math.abs(100 - sum), `${section} percent sum`).toBeLessThanOrEqual(
        1,
      );
    }
  }

  validateChart(chart: OverallChartData, section: string): void {
    expect(Array.isArray(chart.categories), `${section}.categories`).toBe(true);
    expect(Array.isArray(chart.series), `${section}.series`).toBe(true);
    for (const series of chart.series) {
      expect(series.name, `${section}.series.name`).toBeTruthy();
      expect(Array.isArray(series.data), `${section}.series.data`).toBe(true);
      if (chart.categories.length > 0 && series.data.length > 0) {
        expect(
          series.data.length,
          `${section} series length matches categories`,
        ).toBe(chart.categories.length);
      }
      for (const point of series.data) {
        expect(Number.isFinite(point), `${section} series point`).toBe(true);
      }
    }
  }

  validateChartsAndDonuts(data: OverallMetricsData): void {
    for (const key of OVERALL_METRICS_CHART_KEYS) {
      this.validateChart(data[key], key);
    }
    for (const key of OVERALL_METRICS_DONUT_KEYS) {
      this.validateLabeledValues(data[key], key);
    }
  }

  validateInstallationSummary(data: OverallMetricsData): void {
    this.validateLabeledValues(data.installationSummary, "installationSummary", {
      requireNonEmpty: true,
      percentSumNear100: true,
    });
    const labels = data.installationSummary.map((i) =>
      i.label.trim().toLowerCase(),
    );
    const hasMapped = labels.some(
      (l) =>
        (l.includes("mapped") && !l.includes("unmapped")) ||
        (l.includes("installed") && !l.includes("non")),
    );
    const hasUnmapped = labels.some(
      (l) =>
        l.includes("unmapped") ||
        l.includes("non-installed") ||
        l.includes("non installed"),
    );
    expect(hasMapped, "mapped / installed meters row").toBe(true);
    expect(hasUnmapped, "unmapped / non-installed meters row").toBe(true);
  }

  validateScenario(
    mapped: MappedOverallMetrics,
    scenario: OverallMetricsScenario,
  ): void {
    this.validateResponseEnvelope(mapped.response);
    switch (scenario) {
      case "kpi-cards":
        this.validateAllKpiCards(mapped.data);
        break;
      case "installation-summary":
        this.validateInstallationSummary(mapped.data);
        break;
      case "charts-and-donuts":
        this.validateChartsAndDonuts(mapped.data);
        break;
      case "success":
      default:
        this.validateAllKpiCards(mapped.data);
        this.validateInstallationSummary(mapped.data);
        this.validateChartsAndDonuts(mapped.data);
        break;
    }
  }
}
