import { expect } from "@playwright/test";
import type {
  MappedRealTimePower,
  PhaseReading,
  RealTimePowerData,
  RealTimePowerErrorResponse,
  RealTimePowerScenario,
} from "../Mapper/realtimepower.mapper";

const PHASE_KEYS = ["R-Phase", "Y-Phase", "B-Phase"] as const;
const PHASE_FIELDS = [
  "voltage",
  "voltageUnit",
  "current",
  "currentUnit",
  "powerFactor",
  "powerFactorUnit",
] as const;

export class RealTimePowerValidator {
  validateSuccess(success: boolean) {
    expect(success).toBeTruthy();
  }

  validateNotFoundError(responseBody: RealTimePowerErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("CONSUMER_NOT_FOUND");
    expect(responseBody.error.message.toLowerCase()).toContain(
      "consumer not found",
    );
  }

  validateBlankRefError(responseBody: RealTimePowerErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toContain("ivrsno");
    const fieldErrors = responseBody.error.details?.fieldErrors?.ivrsNo;
    expect(Array.isArray(fieldErrors) && fieldErrors.length > 0).toBeTruthy();
  }

  /** Shape A: `{ success: true, data: null }` */
  validateNullData(mapped: MappedRealTimePower) {
    this.validateSuccess(mapped.success);
    expect(mapped.data).toBeNull();
    expect(mapped.rPhase).toBeNull();
    expect(mapped.yPhase).toBeNull();
    expect(mapped.bPhase).toBeNull();
  }

  validatePhaseKeys(data: RealTimePowerData) {
    PHASE_KEYS.forEach((key) => {
      expect(data).toHaveProperty(key);
    });
  }

  validatePhaseReading(phase: PhaseReading | null, label: string) {
    if (phase == null) {
      return;
    }

    PHASE_FIELDS.forEach((field) => {
      expect(phase, label).toHaveProperty(field);
    });

    expect(phase.voltageUnit, label).toBe("Volts");
    expect(phase.currentUnit, label).toBe("Amps");
    expect(phase.powerFactorUnit, label).toBe("Power Factor");

    expect(
      typeof phase.voltage === "number" || phase.voltage === null,
      `${label}.voltage`,
    ).toBeTruthy();
    expect(
      typeof phase.current === "number" || phase.current === null,
      `${label}.current`,
    ).toBeTruthy();
    expect(
      typeof phase.powerFactor === "number" || phase.powerFactor === null,
      `${label}.powerFactor`,
    ).toBeTruthy();

    if (phase.voltage != null) {
      expect(Number.isFinite(phase.voltage)).toBeTruthy();
      expect(phase.voltage).toBeGreaterThan(0);
      expect(phase.voltage).toBeLessThan(350);
    }
    if (phase.current != null) {
      expect(Number.isFinite(phase.current)).toBeTruthy();
      expect(phase.current).toBeGreaterThanOrEqual(0);
      expect(phase.current).toBeLessThan(1000);
    }
    if (phase.powerFactor != null) {
      expect(Number.isFinite(phase.powerFactor)).toBeTruthy();
      expect(phase.powerFactor).toBeGreaterThanOrEqual(-1);
      expect(phase.powerFactor).toBeLessThanOrEqual(1);
    }

    if (phase.current === null && phase.voltage === null) {
      expect(phase.powerFactor).toBeNull();
    }
  }

  /** Shape B / TP: all three phase objects with units (user sample). */
  validateTpPhases(mapped: MappedRealTimePower) {
    this.validateSuccess(mapped.success);
    expect(mapped.data).not.toBeNull();
    const data = mapped.data as RealTimePowerData;
    this.validatePhaseKeys(data);

    expect(data["R-Phase"]).not.toBeNull();
    expect(data["Y-Phase"]).not.toBeNull();
    expect(data["B-Phase"]).not.toBeNull();

    for (const key of PHASE_KEYS) {
      this.validatePhaseReading(data[key], key);
      const phase = data[key] as PhaseReading;
      expect(phase.voltage).not.toBeNull();
      expect(phase.current).not.toBeNull();
      expect(phase.powerFactor).not.toBeNull();
    }
  }

  /** SP backend: only R-Phase object; Y/B null. */
  validateSpPhases(mapped: MappedRealTimePower) {
    this.validateSuccess(mapped.success);
    expect(mapped.data).not.toBeNull();
    const data = mapped.data as RealTimePowerData;
    this.validatePhaseKeys(data);
    expect(data["R-Phase"]).not.toBeNull();
    expect(data["Y-Phase"]).toBeNull();
    expect(data["B-Phase"]).toBeNull();
    this.validatePhaseReading(data["R-Phase"], "R-Phase");
  }

  /**
   * Live 200 body may be either:
   * - `{ success: true, data: null }`
   * - populated phases (TP: R/Y/B objects, or SP: R only)
   */
  validateLiveOk(mapped: MappedRealTimePower) {
    this.validateSuccess(mapped.success);
    if (mapped.data == null) {
      this.validateNullData(mapped);
      return;
    }

    const data = mapped.data;
    this.validatePhaseKeys(data);
    this.validatePhaseReading(data["R-Phase"], "R-Phase");
    this.validatePhaseReading(data["Y-Phase"], "Y-Phase");
    this.validatePhaseReading(data["B-Phase"], "B-Phase");

    const populated = PHASE_KEYS.filter((key) => data[key] != null).length;
    expect(populated).toBeGreaterThan(0);

    if (populated === 3) {
      expect(data["R-Phase"]).not.toBeNull();
      expect(data["Y-Phase"]).not.toBeNull();
      expect(data["B-Phase"]).not.toBeNull();
    }
    if (populated === 1) {
      expect(data["R-Phase"]).not.toBeNull();
      expect(data["Y-Phase"]).toBeNull();
      expect(data["B-Phase"]).toBeNull();
    }
  }

  validateScenario(
    mapped: MappedRealTimePower,
    scenario: RealTimePowerScenario,
  ) {
    switch (scenario) {
      case "contract_null_data":
        this.validateNullData(mapped);
        break;
      case "contract_tp_phases":
        this.validateTpPhases(mapped);
        break;
      case "contract_sp_phases":
        this.validateSpPhases(mapped);
        break;
      case "power_by_ivrs":
      case "power_by_account":
      case "power_by_meter":
      case "power_ignore_unknown_query":
      case "meter_not_found":
        this.validateLiveOk(mapped);
        break;
      default:
        break;
    }
  }
}
