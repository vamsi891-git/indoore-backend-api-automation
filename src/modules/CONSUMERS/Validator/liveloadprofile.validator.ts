import { expect } from "@playwright/test";
import type {
  LiveLoadProfileData,
  LiveLoadProfileErrorResponse,
  LiveLoadProfileMetric,
  LiveLoadProfileScenario,
  MappedLiveLoadProfile,
} from "../Mapper/liveloadprofile.mapper";

const METRIC_TITLES = [
  "Active Power",
  "Apparent Power",
  "Reactive Power",
] as const;

export class LiveLoadProfileValidator {
  validateSuccess(success: boolean) {
    expect(success).toBeTruthy();
  }

  validateNotFoundError(responseBody: LiveLoadProfileErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("CONSUMER_NOT_FOUND");
    expect(responseBody.error.message.toLowerCase()).toContain(
      "consumer not found",
    );
  }

  validateBlankRefError(responseBody: LiveLoadProfileErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toContain("ivrsno");
    const fieldErrors = responseBody.error.details?.fieldErrors?.ivrsNo;
    expect(Array.isArray(fieldErrors) && fieldErrors.length > 0).toBeTruthy();
  }

  validateNullData(mapped: MappedLiveLoadProfile) {
    this.validateSuccess(mapped.success);
    expect(mapped.data).toBeNull();
    expect(mapped.lastReadingIso).toBeNull();
    expect(mapped.meterPhase).toBeNull();
    expect(mapped.total).toBeNull();
    expect(mapped.activePower).toBeNull();
    expect(mapped.apparentPower).toBeNull();
    expect(mapped.reactivePower).toBeNull();
  }

  validateMetricShape(metric: LiveLoadProfileMetric) {
    expect(metric).toHaveProperty("title");
    expect(metric).toHaveProperty("value");
    expect(metric).toHaveProperty("percent");
    expect(METRIC_TITLES).toContain(metric.title);
    expect(
      typeof metric.value === "number" || metric.value === null,
    ).toBeTruthy();
    expect(
      typeof metric.percent === "number" || metric.percent === null,
    ).toBeTruthy();
    if (metric.value != null) {
      expect(Number.isFinite(metric.value)).toBeTruthy();
    }
    if (metric.percent != null) {
      expect(Number.isFinite(metric.percent)).toBeTruthy();
      expect(metric.percent).toBeGreaterThanOrEqual(0);
      expect(metric.percent).toBeLessThanOrEqual(100);
    }
  }

  validateLastReadingIso(iso: string | null) {
    if (iso != null) {
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(Number.isNaN(Date.parse(iso))).toBeFalsy();
    }
  }

  validateMeterPhase(phase: "SP" | "TP" | null) {
    if (phase != null) {
      expect(["SP", "TP"]).toContain(phase);
    }
  }

  /** Backend: total = round(|kW|+|kVA|+|kvar|, 3). */
  validateTotal(data: LiveLoadProfileData) {
    if (data.total == null) return;
    expect(Number.isFinite(data.total)).toBeTruthy();
    expect(data.total).toBeGreaterThanOrEqual(0);

    const kw = data.metrics.find((m) => m.title === "Active Power")?.value;
    const kva = data.metrics.find((m) => m.title === "Apparent Power")?.value;
    const kvar = data.metrics.find((m) => m.title === "Reactive Power")?.value;

    if (kw != null || kva != null || kvar != null) {
      const expected =
        Math.round(
          (Math.abs(kw ?? 0) +
            Math.abs(kva ?? 0) +
            Math.abs(kvar ?? 0)) *
            1000,
        ) / 1000;
      expect(data.total).toBe(expected);
    }
  }

  /** Backend: percent = round((|v|/total)*1000)/10 when total > 0. */
  validatePercents(data: LiveLoadProfileData) {
    if (data.total == null || data.total <= 0) return;

    for (const metric of data.metrics) {
      if (metric.value == null) {
        expect(metric.percent).toBeNull();
        continue;
      }
      expect(metric.percent).not.toBeNull();
      const expected =
        Math.round((Math.abs(metric.value) / data.total) * 1000) / 10;
      expect(metric.percent).toBe(expected);
    }
  }

  validateMetricsArray(data: LiveLoadProfileData) {
    expect(Array.isArray(data.metrics)).toBeTruthy();
    expect(data.metrics).toHaveLength(3);
    const titles = data.metrics.map((m) => m.title);
    expect(titles).toEqual([...METRIC_TITLES]);
    for (const metric of data.metrics) {
      this.validateMetricShape(metric);
    }
  }

  validatePowerRanges(data: LiveLoadProfileData) {
    for (const metric of data.metrics) {
      if (metric.value != null) {
        expect(metric.value).toBeGreaterThanOrEqual(0);
      }
    }
  }

  /** kVA >= kW when both present; reactive ≈ sqrt(kVA² − kW²) for SP contract. */
  validatePowerRules(data: LiveLoadProfileData) {
    const kw = data.metrics.find((m) => m.title === "Active Power")?.value;
    const kva = data.metrics.find((m) => m.title === "Apparent Power")?.value;
    const kvar = data.metrics.find((m) => m.title === "Reactive Power")?.value;

    if (kw != null && kva != null) {
      expect(kva).toBeGreaterThanOrEqual(kw);
    }
    if (kw != null && kva != null && kvar != null) {
      const expected = Math.sqrt(Math.max(kva * kva - kw * kw, 0));
      expect(Math.abs(expected - kvar)).toBeLessThan(0.15);
    }
  }

  validatePopulatedMetrics(mapped: MappedLiveLoadProfile) {
    this.validateSuccess(mapped.success);
    expect(mapped.data).not.toBeNull();
    const data = mapped.data as LiveLoadProfileData;

    expect(data).toHaveProperty("lastReadingIso");
    expect(data).toHaveProperty("meterPhase");
    expect(data).toHaveProperty("total");
    expect(data).toHaveProperty("metrics");

    this.validateLastReadingIso(data.lastReadingIso);
    this.validateMeterPhase(data.meterPhase);
    this.validateMetricsArray(data);
    this.validateTotal(data);
    this.validatePercents(data);
    this.validatePowerRanges(data);
  }

  validateTpMetrics(mapped: MappedLiveLoadProfile) {
    this.validatePopulatedMetrics(mapped);
    const data = mapped.data as LiveLoadProfileData;
    expect(data.meterPhase).toBe("TP");
    expect(data.lastReadingIso).toBe("2026-05-19T08:30:00.000Z");
    expect(data.total).toBe(16.4);
    expect(mapped.activePower?.value).toBe(8);
    expect(mapped.apparentPower?.value).toBe(8);
    expect(mapped.reactivePower?.value).toBe(0.4);
  }

  validateSpMetrics(mapped: MappedLiveLoadProfile) {
    this.validatePopulatedMetrics(mapped);
    const data = mapped.data as LiveLoadProfileData;
    expect(data.meterPhase).toBe("SP");
    this.validatePowerRules(data);
  }

  validateLiveOk(mapped: MappedLiveLoadProfile) {
    this.validateSuccess(mapped.success);
    if (mapped.data == null) {
      this.validateNullData(mapped);
      return;
    }
    this.validatePopulatedMetrics(mapped);
    this.validatePowerRules(mapped.data);
  }

  validateScenario(
    mapped: MappedLiveLoadProfile,
    scenario: LiveLoadProfileScenario,
  ) {
    switch (scenario) {
      case "contract_null_data":
        this.validateNullData(mapped);
        break;
      case "contract_tp_metrics":
        this.validateTpMetrics(mapped);
        break;
      case "contract_sp_metrics":
        this.validateSpMetrics(mapped);
        break;
      case "llp_by_ivrs":
      case "llp_by_account":
      case "llp_by_meter":
      case "llp_ignore_unknown_query":
      case "meter_not_found":
        this.validateLiveOk(mapped);
        break;
      default:
        break;
    }
  }
}
