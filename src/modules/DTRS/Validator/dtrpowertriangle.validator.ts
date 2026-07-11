import { expect } from "@playwright/test";
import {
  dtrPowerTriangleContractReactivePfMeta,
  dtrPowerTriangleContractReactiveTriangleMeta,
  dtrPowerTriangleRequiredFields,
} from "../Data/dtrpowertriangle.data";
import type {
  DtrPowerTriangleErrorResponse,
  DtrPowerTriangleResponse,
  DtrPowerTriangleScenario,
  MappedDtrPowerTriangle,
} from "../Mapper/dtrpowertriangle.mapper";
import { deriveReactivePower } from "../utils/dtr-backend.util";

export class DtrPowerTriangleValidator {
  validateSuccess(success: boolean): void {
    expect(success).toBeTruthy();
  }

  validateNotFoundError(responseBody: DtrPowerTriangleErrorResponse): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("DTR_NOT_FOUND");
    expect(responseBody.error.message.toLowerCase()).toContain("dtr not found");
  }

  validateBlankCodeError(responseBody: DtrPowerTriangleErrorResponse): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toMatch(
      /dtr|network|code/i,
    );
  }

  validateMeterDataUnavailableError(
    responseBody: DtrPowerTriangleErrorResponse,
  ): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("DTR_METER_DATA_UNAVAILABLE");
    expect(responseBody.error.message.toLowerCase()).toMatch(
      /meter reading|power triangle/i,
    );
  }

  validateTimeoutFallbackStatus(status: number): void {
    expect([200, 503]).toContain(status);
  }

  validateTimeoutFallbackTriangle(mapped: MappedDtrPowerTriangle): void {
    expect(mapped.activePowerKw).toBeNull();
    expect(mapped.reactivePowerKvar).toBeNull();
    expect(mapped.apparentPowerKva).toBeNull();
    expect(mapped.powerFactor).toBeNull();
  }

  validateResponseEnvelope(response: DtrPowerTriangleResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateFields(mapped: MappedDtrPowerTriangle): void {
    for (const field of dtrPowerTriangleRequiredFields) {
      expect(mapped).toHaveProperty(field);
    }
  }

  validateTypes(mapped: MappedDtrPowerTriangle): void {
    for (const field of dtrPowerTriangleRequiredFields) {
      const value = mapped[field];
      expect(value === null || typeof value === "number").toBeTruthy();
    }
  }

  validateFiniteNumbers(mapped: MappedDtrPowerTriangle): void {
    for (const field of dtrPowerTriangleRequiredFields) {
      const value = mapped[field];
      if (typeof value === "number") {
        expect(Number.isFinite(value)).toBeTruthy();
        expect(Number.isNaN(value)).toBeFalsy();
      }
    }
  }

  validatePowerFactor(powerFactor: number | null): void {
    if (powerFactor !== null) {
      expect(Math.abs(powerFactor)).toBeLessThanOrEqual(1);
    }
  }

  validateNonNegativePower(mapped: MappedDtrPowerTriangle): void {
    const fields = [
      "activePowerKw",
      "reactivePowerKvar",
      "apparentPowerKva",
    ] as const;
    for (const field of fields) {
      const value = mapped[field];
      if (value !== null) {
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  }

  validateTriangleConstraint(mapped: MappedDtrPowerTriangle): void {
    const { activePowerKw, apparentPowerKva } = mapped;
    if (activePowerKw !== null && apparentPowerKva !== null) {
      expect(apparentPowerKva + 0.001).toBeGreaterThanOrEqual(activePowerKw);
    }
  }

  validateReactiveDerivation(mapped: MappedDtrPowerTriangle): void {
    const {
      activePowerKw,
      apparentPowerKva,
      powerFactor,
      reactivePowerKvar,
    } = mapped;

    if (reactivePowerKvar === null) {
      expect(
        deriveReactivePower(activePowerKw, apparentPowerKva, powerFactor),
      ).toBeNull();
      return;
    }

    const fromPf = deriveReactivePower(
      activePowerKw,
      apparentPowerKva,
      powerFactor,
    );
    const fromTriangle = deriveReactivePower(
      activePowerKw,
      apparentPowerKva,
      null,
    );

    if (fromPf !== null && reactivePowerKvar === fromPf) {
      return;
    }
    if (fromTriangle !== null && reactivePowerKvar === fromTriangle) {
      return;
    }

    // Meter kvar column takes precedence over PF-derived estimate.
    if (
      activePowerKw !== null &&
      apparentPowerKva !== null &&
      apparentPowerKva >= activePowerKw
    ) {
      const maxQ =
        Math.round(
          Math.sqrt(apparentPowerKva ** 2 - activePowerKw ** 2) * 100,
        ) / 100;
      expect(reactivePowerKvar).toBeGreaterThanOrEqual(0);
      expect(reactivePowerKvar).toBeLessThanOrEqual(maxQ + 0.01);
      return;
    }

    expect(reactivePowerKvar).toBe(fromPf ?? fromTriangle);
  }

  validateAllNull(mapped: MappedDtrPowerTriangle): void {
    expect(mapped.activePowerKw).toBeNull();
    expect(mapped.reactivePowerKvar).toBeNull();
    expect(mapped.apparentPowerKva).toBeNull();
    expect(mapped.powerFactor).toBeNull();
  }

  validateAllZeroDegraded(mapped: MappedDtrPowerTriangle): void {
    expect(mapped.activePowerKw).toBe(0);
    expect(mapped.reactivePowerKvar).toBe(0);
    expect(mapped.apparentPowerKva).toBe(0);
    expect(mapped.powerFactor).toBe(0);
  }

  validateLiveOk(mapped: MappedDtrPowerTriangle): void {
    this.validateSuccess(mapped.success);
    this.validateFields(mapped);
    this.validateTypes(mapped);
    this.validateFiniteNumbers(mapped);
    this.validatePowerFactor(mapped.powerFactor);
    this.validateNonNegativePower(mapped);
    this.validateTriangleConstraint(mapped);
    this.validateReactiveDerivation(mapped);
  }

  validateSpInstantaneousContract(mapped: MappedDtrPowerTriangle): void {
    this.validateLiveOk(mapped);
    expect(mapped.activePowerKw).toBe(25.5);
    expect(mapped.apparentPowerKva).toBe(30);
    expect(mapped.powerFactor).toBe(0.85);
    expect(mapped.reactivePowerKvar).toBe(15.8);
  }

  validateTpInstantaneousContract(mapped: MappedDtrPowerTriangle): void {
    this.validateLiveOk(mapped);
    expect(mapped.activePowerKw).toBe(40);
    expect(mapped.apparentPowerKva).toBe(50);
    expect(mapped.powerFactor).toBe(0.92);
    expect(mapped.reactivePowerKvar).toBe(21.2);
  }

  validateReactivePfContract(mapped: MappedDtrPowerTriangle): void {
    this.validateLiveOk(mapped);
    const meta = dtrPowerTriangleContractReactivePfMeta;
    expect(mapped.reactivePowerKvar).toBe(meta.expectedReactiveKvar);
    expect(mapped.reactivePowerKvar).toBe(
      deriveReactivePower(
        meta.activePowerKw,
        meta.apparentPowerKva,
        meta.powerFactor,
      ),
    );
  }

  validateReactiveTriangleContract(mapped: MappedDtrPowerTriangle): void {
    this.validateLiveOk(mapped);
    const meta = dtrPowerTriangleContractReactiveTriangleMeta;
    expect(mapped.reactivePowerKvar).toBe(meta.expectedReactiveKvar);
    expect(mapped.reactivePowerKvar).toBe(
      deriveReactivePower(meta.activePowerKw, meta.apparentPowerKva, null),
    );
  }

  validateScenario(
    mapped: MappedDtrPowerTriangle,
    scenario: DtrPowerTriangleScenario,
  ): void {
    switch (scenario) {
      case "contract_all_zero_degraded":
        this.validateLiveOk(mapped);
        this.validateAllZeroDegraded(mapped);
        break;
      case "contract_all_null_backend":
        this.validateLiveOk(mapped);
        this.validateAllNull(mapped);
        break;
      case "contract_sp_instantaneous":
        this.validateSpInstantaneousContract(mapped);
        break;
      case "contract_tp_instantaneous":
        this.validateTpInstantaneousContract(mapped);
        break;
      case "contract_reactive_from_pf":
        this.validateReactivePfContract(mapped);
        break;
      case "contract_reactive_from_triangle":
        this.validateReactiveTriangleContract(mapped);
        break;
      case "dpt_by_code_primary":
      case "dpt_by_code_alt":
      case "dpt_ignore_unknown_query":
        this.validateLiveOk(mapped);
        break;
      default:
        break;
    }
  }
}
