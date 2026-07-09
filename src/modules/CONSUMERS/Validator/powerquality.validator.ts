import { expect } from "@playwright/test";
import type {
  MappedPowerQuality,
  PowerQualityData,
  PowerQualityErrorResponse,
  PowerQualityMetric,
  PowerQualityScenario,
} from "../Mapper/powerquality.mapper";

const METRIC_KEYS = [
  "overallPf",
  "frequency",
  "neutralCurrent",
  "mdKw",
  "mdKva",
] as const;

const EXPECTED_TITLES: Record<(typeof METRIC_KEYS)[number], string> = {
  overallPf: "Overall PF",
  frequency: "Frequency",
  neutralCurrent: "Neutral Current",
  mdKw: "MD kW",
  mdKva: "MD kVA",
};

const EXPECTED_UNITS: Record<(typeof METRIC_KEYS)[number], string> = {
  overallPf: "Power Factor",
  frequency: "Hz",
  neutralCurrent: "Amps",
  mdKw: "kW",
  mdKva: "kVA",
};

export class PowerQualityValidator {
  validateSuccess(success: boolean) {
    expect(success).toBeTruthy();
  }

  validateNotFoundError(responseBody: PowerQualityErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("CONSUMER_NOT_FOUND");
    expect(responseBody.error.message.toLowerCase()).toContain(
      "consumer not found",
    );
  }

  validateBlankRefError(responseBody: PowerQualityErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toContain("ivrsno");
    const fieldErrors = responseBody.error.details?.fieldErrors?.ivrsNo;
    expect(Array.isArray(fieldErrors) && fieldErrors.length > 0).toBeTruthy();
  }

  validateNullData(mapped: MappedPowerQuality) {
    this.validateSuccess(mapped.success);
    expect(mapped.data).toBeNull();
    for (const key of METRIC_KEYS) {
      expect(mapped[key]).toBeNull();
    }
  }

  validateMetricShape(metric: PowerQualityMetric, key: (typeof METRIC_KEYS)[number]) {
    expect(metric).toHaveProperty("title");
    expect(metric).toHaveProperty("value");
    expect(metric).toHaveProperty("unit");
    expect(metric).toHaveProperty("subtitle");

    expect(metric.title).toBe(EXPECTED_TITLES[key]);
    expect(metric.unit).toBe(EXPECTED_UNITS[key]);
    expect(
      typeof metric.subtitle === "string" || metric.subtitle === null,
    ).toBeTruthy();
    expect(
      typeof metric.value === "number" || metric.value === null,
    ).toBeTruthy();

    if (metric.value != null) {
      expect(Number.isFinite(metric.value)).toBeTruthy();
    }
  }

  validateMetricRanges(data: PowerQualityData) {
    if (data.overallPf.value != null) {
      expect(data.overallPf.value).toBeGreaterThanOrEqual(-1);
      expect(data.overallPf.value).toBeLessThanOrEqual(1);
    }
    if (data.frequency.value != null) {
      expect(data.frequency.value).toBeGreaterThan(40);
      expect(data.frequency.value).toBeLessThan(65);
    }
    if (data.neutralCurrent.value != null) {
      expect(data.neutralCurrent.value).toBeGreaterThanOrEqual(0);
      expect(data.neutralCurrent.value).toBeLessThan(1000);
    }
    if (data.mdKw.value != null) {
      expect(data.mdKw.value).toBeGreaterThanOrEqual(0);
    }
    if (data.mdKva.value != null) {
      expect(data.mdKva.value).toBeGreaterThanOrEqual(0);
    }
  }

  validatePopulatedMetrics(mapped: MappedPowerQuality) {
    this.validateSuccess(mapped.success);
    expect(mapped.data).not.toBeNull();
    const data = mapped.data as PowerQualityData;

    for (const key of METRIC_KEYS) {
      expect(data).toHaveProperty(key);
      this.validateMetricShape(data[key], key);
    }
    this.validateMetricRanges(data);
  }

  /** SP sample: neutral current may be a number. */
  validateSpMetrics(mapped: MappedPowerQuality) {
    this.validatePopulatedMetrics(mapped);
    const data = mapped.data as PowerQualityData;
    expect(data.neutralCurrent.unit).toBe("Amps");
    expect(data.overallPf.subtitle).toBe("System PF");
    expect(data.frequency.subtitle).toBe("Frequency");
    expect(data.neutralCurrent.subtitle).toBe("Neutral Load");
  }

  /** TP: backend sets neutralCurrent.value = null. */
  validateTpMetrics(mapped: MappedPowerQuality) {
    this.validatePopulatedMetrics(mapped);
    const data = mapped.data as PowerQualityData;
    expect(data.neutralCurrent.value).toBeNull();
    expect(data.neutralCurrent.unit).toBe("Amps");
  }

  validateLiveOk(mapped: MappedPowerQuality) {
    this.validateSuccess(mapped.success);
    if (mapped.data == null) {
      this.validateNullData(mapped);
      return;
    }
    this.validatePopulatedMetrics(mapped);
  }

  validateScenario(
    mapped: MappedPowerQuality,
    scenario: PowerQualityScenario,
  ) {
    switch (scenario) {
      case "contract_null_data":
        this.validateNullData(mapped);
        break;
      case "contract_sp_metrics":
        this.validateSpMetrics(mapped);
        break;
      case "contract_tp_metrics":
        this.validateTpMetrics(mapped);
        break;
      case "pq_by_ivrs":
      case "pq_by_account":
      case "pq_by_meter":
      case "pq_ignore_unknown_query":
      case "meter_not_found":
        this.validateLiveOk(mapped);
        break;
      default:
        break;
    }
  }
}
