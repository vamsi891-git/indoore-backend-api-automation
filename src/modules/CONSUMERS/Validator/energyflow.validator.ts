import { expect } from "@playwright/test";
import {
  ENERGY_FLOW_POINT_COUNT,
  energyFlowContractConsumptionFormulaMeta,
} from "../Data/energyflow.data";
import type {
  EnergyFlowErrorResponse,
  EnergyFlowPeriod,
  EnergyFlowPoint,
  EnergyFlowScenario,
  MappedEnergyFlow,
} from "../Mapper/energyflow.mapper";

const VALID_PERIODS: EnergyFlowPeriod[] = [
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

const LABEL_PATTERNS: Record<EnergyFlowPeriod, RegExp> = {
  hourly: /^\d{2}:\d{2}$/,
  daily: /^\d{1,2} [A-Za-z]{3}$/,
  weekly: /^W\d+$/,
  monthly: /^[A-Za-z]{3,4} \d{4}$/,
  yearly: /^\d{4}$/,
};

/** Mirrors backend roundEnergy. */
function roundEnergy(value: number): number {
  return Math.round(value * 100) / 100;
}

type CumulativeFields = Pick<
  EnergyFlowPoint,
  "kwhImport" | "kvahImport" | "kwhExport" | "kvahExport"
>;

/**
 * Mirrors backend computeConsumptionFromRawReadings diff():
 * max(0, roundEnergy(end − start)) per bucket boundary.
 */
function consumptionDelta(end: number | null, start: number | null): number {
  if (end == null || start == null) return 0;
  if (!Number.isFinite(end) || !Number.isFinite(start)) return 0;
  return roundEnergy(Math.max(0, end - start));
}

function consumptionDeltasFromCumulativeSeries(
  points: EnergyFlowPoint[],
  startCumulative: CumulativeFields,
): {
  kwh: number[];
  kvah: number[];
  kwhExport: number[];
  kvahExport: number[];
} {
  let prev = startCumulative;
  const kwh: number[] = [];
  const kvah: number[] = [];
  const kwhExport: number[] = [];
  const kvahExport: number[] = [];

  for (const point of points) {
    kwh.push(consumptionDelta(point.kwhImport, prev.kwhImport));
    kvah.push(consumptionDelta(point.kvahImport, prev.kvahImport));
    kwhExport.push(consumptionDelta(point.kwhExport, prev.kwhExport));
    kvahExport.push(consumptionDelta(point.kvahExport, prev.kvahExport));
    prev = point;
  }

  return { kwh, kvah, kwhExport, kvahExport };
}

export class EnergyFlowValidator {
  validateSuccess(success: boolean) {
    expect(success).toBeTruthy();
  }

  validateNotFoundError(responseBody: EnergyFlowErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("CONSUMER_NOT_FOUND");
    expect(responseBody.error.message.toLowerCase()).toContain(
      "consumer not found",
    );
  }

  validateBlankRefError(responseBody: EnergyFlowErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toContain("ivrsno");
    const fieldErrors = responseBody.error.details?.fieldErrors?.ivrsNo;
    expect(Array.isArray(fieldErrors) && fieldErrors.length > 0).toBeTruthy();
  }

  validateInvalidPeriodError(responseBody: EnergyFlowErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toContain("period");
    const fieldErrors = responseBody.error.details?.fieldErrors?.period;
    expect(Array.isArray(fieldErrors) && fieldErrors.length > 0).toBeTruthy();
  }

  validatePeriod(period: string) {
    expect(VALID_PERIODS).toContain(period);
  }

  validatePointsCount(period: EnergyFlowPeriod, points: EnergyFlowPoint[]) {
    expect(points.length).toBe(ENERGY_FLOW_POINT_COUNT[period]);
  }

  validatePointStructure(points: EnergyFlowPoint[]) {
    for (const point of points) {
      expect(point).toHaveProperty("label");
      expect(point).toHaveProperty("kwhImport");
      expect(point).toHaveProperty("kvahImport");
      expect(point).toHaveProperty("kwhExport");
      expect(point).toHaveProperty("kvahExport");
      expect(typeof point.label).toBe("string");
      expect(point.label.trim().length).toBeGreaterThan(0);
      for (const key of [
        "kwhImport",
        "kvahImport",
        "kwhExport",
        "kvahExport",
      ] as const) {
        expect(typeof point[key]).toBe("number");
        expect(Number.isFinite(point[key])).toBeTruthy();
      }
    }
  }

  /** Backend roundEnergy: 2 decimal places, non-negative cumulative registers. */
  validateEnergyRounding(points: EnergyFlowPoint[]) {
    for (const point of points) {
      for (const key of [
        "kwhImport",
        "kvahImport",
        "kwhExport",
        "kvahExport",
      ] as const) {
        expect(point[key]).toBeGreaterThanOrEqual(0);
        expect(point[key]).toBe(roundEnergy(point[key]));
      }
    }
  }

  /**
   * energyFlow view uses computeCumulativeFromRawReadings — carry-forward
   * makes each cumulative series non-decreasing across buckets.
   */
  validateCumulativeMonotonicity(points: EnergyFlowPoint[]) {
    const hasAnyImport = points.some(
      (p) => p.kwhImport > 0 || p.kvahImport > 0,
    );
    if (!hasAnyImport) return;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]!;
      const curr = points[i]!;
      expect(curr.kwhImport).toBeGreaterThanOrEqual(prev.kwhImport);
      expect(curr.kvahImport).toBeGreaterThanOrEqual(prev.kvahImport);
      expect(curr.kwhExport).toBeGreaterThanOrEqual(prev.kwhExport);
      expect(curr.kvahExport).toBeGreaterThanOrEqual(prev.kvahExport);
    }
  }

  /** When both import cumulative registers are positive, kVAh ≥ kWh. */
  validateImportEnergyIdentity(points: EnergyFlowPoint[]) {
    for (const point of points) {
      if (point.kwhImport > 0 && point.kvahImport > 0) {
        expect(point.kvahImport).toBeGreaterThanOrEqual(point.kwhImport);
      }
    }
  }

  validateLabelFormat(period: EnergyFlowPeriod, points: EnergyFlowPoint[]) {
    const pattern = LABEL_PATTERNS[period];
    for (const point of points) {
      expect(pattern.test(point.label.trim())).toBeTruthy();
    }
  }

  validatePeriodMatchesQuery(
    mapped: MappedEnergyFlow,
    expectedPeriod: EnergyFlowPeriod,
  ) {
    expect(mapped.period).toBe(expectedPeriod);
    this.validatePointsCount(expectedPeriod, mapped.points);
    this.validateLabelFormat(expectedPeriod, mapped.points);
  }

  validateContractFixture(
    mapped: MappedEnergyFlow,
    period: EnergyFlowPeriod,
  ) {
    this.validateSuccess(mapped.success);
    this.validatePeriod(mapped.period);
    expect(mapped.period).toBe(period);
    this.validatePointsCount(period, mapped.points);
    this.validatePointStructure(mapped.points);
    this.validateEnergyRounding(mapped.points);
    this.validateLabelFormat(period, mapped.points);
  }

  validateLiveOk(
    mapped: MappedEnergyFlow,
    expectedPeriod: EnergyFlowPeriod,
  ) {
    this.validateSuccess(mapped.success);
    this.validatePeriod(mapped.period);
    this.validatePeriodMatchesQuery(mapped, expectedPeriod);
    this.validatePointStructure(mapped.points);
    this.validateEnergyRounding(mapped.points);
    this.validateCumulativeMonotonicity(mapped.points);
    this.validateImportEnergyIdentity(mapped.points);
  }

  validateCumulativeNonzeroContract(mapped: MappedEnergyFlow) {
    this.validateContractFixture(mapped, "daily");
    this.validateCumulativeMonotonicity(mapped.points);
    this.validateImportEnergyIdentity(mapped.points);

    const hasPositive = mapped.points.some((p) => p.kwhImport > 0);
    expect(hasPositive).toBeTruthy();

    const day6 = mapped.points.find((p) => p.label === "6 Jul");
    expect(day6?.kwhImport).toBe(105.5);
    expect(day6?.kvahImport).toBe(116.2);

    const day9 = mapped.points.find((p) => p.label === "9 Jul");
    expect(day9?.kwhImport).toBe(125.33);
  }

  /**
   * Verifies consumption graph formula against cumulative energy-flow registers:
   * consumptionKwh[i] = max(0, cumulative[i] − cumulative[i−1])
   * with cumulative[−1] = reading at plan.windowStart.
   */
  validateConsumptionFormulaContract(mapped: MappedEnergyFlow) {
    this.validateCumulativeNonzeroContract(mapped);

    const start = energyFlowContractConsumptionFormulaMeta.cumulativeAtWindowStart;
    const deltas = consumptionDeltasFromCumulativeSeries(mapped.points, start);

    expect(deltas.kwh).toEqual(
      [...energyFlowContractConsumptionFormulaMeta.expectedConsumptionKwh],
    );
    expect(deltas.kvah).toEqual(
      [...energyFlowContractConsumptionFormulaMeta.expectedConsumptionKvah],
    );

    const totalKwh = deltas.kwh.reduce((sum, v) => sum + v, 0);
    const lastCumulative = mapped.points[mapped.points.length - 1]!.kwhImport;
    const impliedTotal = roundEnergy(lastCumulative - start.kwhImport);
    expect(totalKwh).toBe(impliedTotal);
  }

  validateScenario(
    mapped: MappedEnergyFlow,
    scenario: EnergyFlowScenario,
    expectedPeriod: EnergyFlowPeriod,
  ) {
    switch (scenario) {
      case "contract_hourly":
        this.validateContractFixture(mapped, "hourly");
        break;
      case "contract_daily":
        this.validateContractFixture(mapped, "daily");
        break;
      case "contract_weekly":
        this.validateContractFixture(mapped, "weekly");
        break;
      case "contract_monthly":
        this.validateContractFixture(mapped, "monthly");
        break;
      case "contract_yearly":
        this.validateContractFixture(mapped, "yearly");
        break;
      case "contract_cumulative_nonzero":
        this.validateCumulativeNonzeroContract(mapped);
        break;
      case "contract_consumption_formula":
        this.validateConsumptionFormulaContract(mapped);
        break;
      case "ef_by_ivrs_daily":
      case "ef_period_hourly":
      case "ef_period_weekly":
      case "ef_period_monthly":
      case "ef_period_yearly":
      case "ef_by_account":
      case "ef_by_meter":
      case "ef_ignore_unknown_query":
      case "meter_not_found":
        this.validateLiveOk(mapped, expectedPeriod);
        break;
      default:
        break;
    }
  }
}
