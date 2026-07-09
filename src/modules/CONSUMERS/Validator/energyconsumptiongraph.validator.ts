import { expect } from "@playwright/test";
import {
  CONSUMPTION_POINT_COUNT,
} from "../Data/energyconsumptiongraph.data";
import type {
  EnergyConsumptionGraphErrorResponse,
  EnergyConsumptionGraphScenario,
  EnergyConsumptionPeriod,
  GraphPoint,
  MappedEnergyConsumptionGraph,
} from "../Mapper/energyconsumptiongraph.mapper";

const VALID_PERIODS: EnergyConsumptionPeriod[] = [
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

const LABEL_PATTERNS: Record<EnergyConsumptionPeriod, RegExp> = {
  hourly: /^\d{2}:\d{2}$/,
  daily: /^\d{1,2} [A-Za-z]{3}$/,
  weekly: /^W\d+$/,
  monthly: /^[A-Za-z]{3,4} \d{4}$/,
  yearly: /^\d{4}$/,
};

export class EnergyConsumptionGraphValidator {
  validateSuccess(success: boolean) {
    expect(success).toBeTruthy();
  }

  validateNotFoundError(responseBody: EnergyConsumptionGraphErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("CONSUMER_NOT_FOUND");
    expect(responseBody.error.message.toLowerCase()).toContain(
      "consumer not found",
    );
  }

  validateBlankRefError(responseBody: EnergyConsumptionGraphErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toContain("ivrsno");
    const fieldErrors = responseBody.error.details?.fieldErrors?.ivrsNo;
    expect(Array.isArray(fieldErrors) && fieldErrors.length > 0).toBeTruthy();
  }

  validateInvalidPeriodError(responseBody: EnergyConsumptionGraphErrorResponse) {
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

  validatePointsCount(period: EnergyConsumptionPeriod, points: GraphPoint[]) {
    expect(points.length).toBe(CONSUMPTION_POINT_COUNT[period]);
  }

  validatePointStructure(points: GraphPoint[]) {
    for (const point of points) {
      expect(point).toHaveProperty("label");
      expect(point).toHaveProperty("consumptionKwh");
      expect(typeof point.label).toBe("string");
      expect(point.label.trim().length).toBeGreaterThan(0);
      expect(typeof point.consumptionKwh).toBe("number");
      expect(Number.isFinite(point.consumptionKwh)).toBeTruthy();
    }
  }

  /** Backend roundEnergy: 2 decimal places. */
  validateConsumptionRounding(points: GraphPoint[]) {
    for (const point of points) {
      expect(point.consumptionKwh).toBeGreaterThanOrEqual(0);
      const rounded =
        Math.round(point.consumptionKwh * 100) / 100;
      expect(point.consumptionKwh).toBe(rounded);
    }
  }

  validateLabelFormat(period: EnergyConsumptionPeriod, points: GraphPoint[]) {
    const pattern = LABEL_PATTERNS[period];
    for (const point of points) {
      expect(pattern.test(point.label.trim())).toBeTruthy();
    }
  }

  validatePeriodMatchesQuery(
    mapped: MappedEnergyConsumptionGraph,
    expectedPeriod: EnergyConsumptionPeriod,
  ) {
    expect(mapped.period).toBe(expectedPeriod);
    this.validatePointsCount(expectedPeriod, mapped.points);
    this.validateLabelFormat(expectedPeriod, mapped.points);
  }

  validateContractFixture(
    mapped: MappedEnergyConsumptionGraph,
    period: EnergyConsumptionPeriod,
  ) {
    this.validateSuccess(mapped.success);
    this.validatePeriod(mapped.period);
    expect(mapped.period).toBe(period);
    this.validatePointsCount(period, mapped.points);
    this.validatePointStructure(mapped.points);
    this.validateConsumptionRounding(mapped.points);
    this.validateLabelFormat(period, mapped.points);
  }

  validateLiveOk(
    mapped: MappedEnergyConsumptionGraph,
    expectedPeriod: EnergyConsumptionPeriod,
  ) {
    this.validateSuccess(mapped.success);
    this.validatePeriod(mapped.period);
    this.validatePeriodMatchesQuery(mapped, expectedPeriod);
    this.validatePointStructure(mapped.points);
    this.validateConsumptionRounding(mapped.points);
  }

  validateNonzeroContract(mapped: MappedEnergyConsumptionGraph) {
    this.validateContractFixture(mapped, "daily");
    const hasPositive = mapped.points.some((p) => p.consumptionKwh > 0);
    expect(hasPositive).toBeTruthy();
    const sample = mapped.points.find((p) => p.label === "3 Jul");
    expect(sample?.consumptionKwh).toBe(8.33);
  }

  validateScenario(
    mapped: MappedEnergyConsumptionGraph,
    scenario: EnergyConsumptionGraphScenario,
    expectedPeriod: EnergyConsumptionPeriod,
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
      case "contract_nonzero_consumption":
        this.validateNonzeroContract(mapped);
        break;
      case "ecg_by_ivrs_daily":
      case "ecg_period_hourly":
      case "ecg_period_weekly":
      case "ecg_period_monthly":
      case "ecg_period_yearly":
      case "ecg_by_account":
      case "ecg_by_meter":
      case "ecg_ignore_unknown_query":
      case "meter_not_found":
        this.validateLiveOk(mapped, expectedPeriod);
        break;
      default:
        break;
    }
  }
}
