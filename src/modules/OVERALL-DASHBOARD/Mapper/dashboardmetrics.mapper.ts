/** Overall dashboard metrics — GET /indore/dashboard/overall-metrics (live sample Aug 2026). */

export type OverallMetricsScenario =
  | "success"
  | "kpi-cards"
  | "installation-summary"
  | "charts-and-donuts";

export interface OverallKpiCard {
  value: string;
  footer?: string;
  footerDelta: number;
  sparklineData: number[];
}

export interface OverallLabeledValue {
  label: string;
  value: number;
  percent: number;
}

export interface OverallChartSeries {
  name: string;
  data: number[];
}

export interface OverallChartData {
  categories: string[];
  series: OverallChartSeries[];
}

export interface OverallMetricsData {
  billingAvailability: OverallKpiCard;
  billingEfficiency: OverallKpiCard;
  revenueGainedRpu: OverallKpiCard;
  totalImprovement: OverallKpiCard;
  avgImprovement: OverallKpiCard;
  subsidySave: OverallKpiCard;
  incentivePf: OverallKpiCard;
  penaltyPf: OverallKpiCard;
  expectedRoi: OverallKpiCard;
  loadEnhanced: OverallKpiCard;
  installationSummary: OverallLabeledValue[];
  lineChartData: OverallChartData;
  disconnectionData: OverallChartData;
  disconnectionSummary: OverallChartData;
  billingEfficiencyChart: OverallChartData;
  billingEfficiencyDonut: OverallLabeledValue[];
  benefitsAtrCasesDonut: OverallLabeledValue[];
  atrAmountChart: OverallChartData;
  defaultLineData: OverallChartData;
}

export interface DashboardMetricsResponse {
  success: boolean;
  data: OverallMetricsData;
  message?: string;
}

export interface MappedOverallMetrics {
  scenario: OverallMetricsScenario;
  response: DashboardMetricsResponse;
  data: OverallMetricsData;
}

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toStringValue(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  return String(value);
}

function mapKpiCard(raw: unknown): OverallKpiCard {
  const row =
    raw !== null && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : {};
  const sparkline = Array.isArray(row.sparklineData)
    ? row.sparklineData.map((v) => toNumber(v))
    : [];
  return {
    value: toStringValue(row.value),
    footer:
      row.footer == null || String(row.footer).trim() === ""
        ? undefined
        : toStringValue(row.footer),
    footerDelta: toNumber(row.footerDelta),
    sparklineData: sparkline,
  };
}

function mapLabeledValues(raw: unknown): OverallLabeledValue[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const row =
      item !== null && typeof item === "object"
        ? (item as Record<string, unknown>)
        : {};
    return {
      label: toStringValue(row.label),
      value: toNumber(row.value),
      percent: toNumber(row.percent),
    };
  });
}

function mapChart(raw: unknown): OverallChartData {
  const row =
    raw !== null && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : {};
  const categories = Array.isArray(row.categories)
    ? row.categories.map((c) => toStringValue(c))
    : [];
  const series = Array.isArray(row.series)
    ? row.series.map((s) => {
        const ser =
          s !== null && typeof s === "object"
            ? (s as Record<string, unknown>)
            : {};
        return {
          name: toStringValue(ser.name),
          data: Array.isArray(ser.data)
            ? ser.data.map((v) => toNumber(v))
            : [],
        };
      })
    : [];
  return { categories, series };
}

export class DashboardMetricsMapper {
  static mapData(data: Record<string, unknown>): OverallMetricsData {
    return {
      billingAvailability: mapKpiCard(data.billingAvailability),
      billingEfficiency: mapKpiCard(data.billingEfficiency),
      revenueGainedRpu: mapKpiCard(data.revenueGainedRpu),
      totalImprovement: mapKpiCard(data.totalImprovement),
      avgImprovement: mapKpiCard(data.avgImprovement),
      subsidySave: mapKpiCard(data.subsidySave),
      incentivePf: mapKpiCard(data.incentivePf),
      penaltyPf: mapKpiCard(data.penaltyPf),
      expectedRoi: mapKpiCard(data.expectedRoi),
      loadEnhanced: mapKpiCard(data.loadEnhanced),
      installationSummary: mapLabeledValues(data.installationSummary),
      lineChartData: mapChart(data.lineChartData),
      disconnectionData: mapChart(data.disconnectionData),
      disconnectionSummary: mapChart(data.disconnectionSummary),
      billingEfficiencyChart: mapChart(data.billingEfficiencyChart),
      billingEfficiencyDonut: mapLabeledValues(data.billingEfficiencyDonut),
      benefitsAtrCasesDonut: mapLabeledValues(data.benefitsAtrCasesDonut),
      atrAmountChart: mapChart(data.atrAmountChart),
      defaultLineData: mapChart(data.defaultLineData),
    };
  }

  static map(
    response: DashboardMetricsResponse,
    scenario: OverallMetricsScenario = "success",
  ): MappedOverallMetrics {
    return {
      scenario,
      response,
      data: this.mapData(response.data as unknown as Record<string, unknown>),
    };
  }
}
