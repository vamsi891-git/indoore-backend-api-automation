import { expect } from "@playwright/test";
import {
  type RevenueSubsidyPfSaveRequest,
  revenueSubsidyPfAccessTokenInvalidMessage,
  revenueSubsidyPfSaveSuccessMessage,
  revenueSubsidyPfSuccessMessage,
  revenueSubsidyPfEmptyPeriodMessage,
  revenueSubsidyPfUnauthorizedMessage,
} from "../Data/revenuesubsidypf.data";
import {
  dtrUnbalanceAccessTokenInvalidCode,
  dtrUnbalanceUnauthorizedCode,
} from "../Data/dtr-unbalance-auth.data";
import type {
  MappedRevenueSubsidyPf,
  MeterCountAmount,
  RevenueSubsidyPfErrorResponse,
  RevenueSubsidyPfResponse,
  RevenueSubsidyPfScenario,
} from "../Mapper/revenuesubsidypf.mapper";

/** 1 crore = 10_000_000 (overallImprovement → overallImprovementCr). */
export const REVENUE_SUBSIDY_PF_CR_DIVISOR = 10_000_000;

const retrieveOrSaveMessages = new Set([
  revenueSubsidyPfSuccessMessage,
  revenueSubsidyPfEmptyPeriodMessage,
  revenueSubsidyPfSaveSuccessMessage,
]);

export class RevenueSubsidyPfValidator {
  validateResponseEnvelope(
    response: RevenueSubsidyPfResponse,
    expectedMessage?: string,
  ): void {
    expect(response.success).toBe(true);
    expect(response).toHaveProperty("data");
    // GET with no saved period returns data: null. POST save is skipped.
    if (response.message == null) return;
    if (expectedMessage != null) {
      const allowed =
        expectedMessage === revenueSubsidyPfSuccessMessage
          ? [revenueSubsidyPfSuccessMessage, revenueSubsidyPfEmptyPeriodMessage]
          : [expectedMessage];
      expect(allowed).toContain(response.message);
      return;
    }
    expect(retrieveOrSaveMessages.has(response.message)).toBeTruthy();
  }

  validateSuccess(success: boolean): void {
    expect(success).toBeTruthy();
  }

  validatePeriod(mapped: MappedRevenueSubsidyPf): void {
    const { periodYear, periodMonth } = mapped.data;
    expect(Number.isInteger(periodYear)).toBeTruthy();
    expect(periodYear).toBeGreaterThanOrEqual(2000);
    expect(periodYear).toBeLessThanOrEqual(2100);
    expect(Number.isInteger(periodMonth)).toBeTruthy();
    expect(periodMonth).toBeGreaterThanOrEqual(1);
    expect(periodMonth).toBeLessThanOrEqual(12);
  }

  validateMeterCountAmount(block: MeterCountAmount, label: string): void {
    expect(Number.isFinite(block.meterCount), label).toBeTruthy();
    expect(block.meterCount, label).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(block.amount), label).toBeTruthy();
    expect(block.amount, label).toBeGreaterThanOrEqual(0);
  }

  validateDataShape(mapped: MappedRevenueSubsidyPf): void {
    const d = mapped.data;
    expect(d.id.trim().length).toBeGreaterThan(0);
    expect(d.createdByUserId.trim().length).toBeGreaterThan(0);
    expect(d.updatedByUserId.trim().length).toBeGreaterThan(0);
    expect(d.createdAt.trim().length).toBeGreaterThan(0);
    expect(d.updatedAt.trim().length).toBeGreaterThan(0);

    this.validateMeterCountAmount(d.billingAvailability, "billingAvailability");
    this.validateMeterCountAmount(d.incentivePf, "incentivePf");
    this.validateMeterCountAmount(d.penaltyPf, "penaltyPf");

    expect(Number.isFinite(d.billingEfficiency.energyLu)).toBeTruthy();
    expect(d.billingEfficiency.energyLu).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(d.billingEfficiency.amount)).toBeTruthy();
    expect(d.billingEfficiency.amount).toBeGreaterThanOrEqual(0);

    expect(Number.isFinite(d.revenueGainedRpu.inputLu)).toBeTruthy();
    expect(d.revenueGainedRpu.inputLu).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(d.revenueGainedRpu.rpu)).toBeTruthy();
    expect(d.revenueGainedRpu.rpu).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(d.revenueGainedRpu.amount)).toBeTruthy();
    expect(d.revenueGainedRpu.amount).toBeGreaterThanOrEqual(0);

    expect(Number.isFinite(d.subsidyAmount)).toBeTruthy();
    expect(d.subsidyAmount).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(d.billCount)).toBeTruthy();
    expect(d.billCount).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(d.overallImprovement)).toBeTruthy();
    expect(d.overallImprovement).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(d.overallImprovementCr)).toBeTruthy();
    expect(d.overallImprovementCr).toBeGreaterThanOrEqual(0);

    if (d.billCount === 0) {
      expect(
        d.avgImprovement === null || d.avgImprovement === 0,
      ).toBeTruthy();
    } else {
      expect(d.avgImprovement).not.toBeNull();
      expect(Number.isFinite(d.avgImprovement as number)).toBeTruthy();
      expect(d.avgImprovement as number).toBeGreaterThanOrEqual(0);
    }
  }

  /**
   * Soft invariants from live sample:
   * - avgImprovement ≈ overallImprovement / billCount (when billCount > 0)
   * - overallImprovementCr ≈ overallImprovement / 1e7
   */
  validateDerivedFields(
    mapped: MappedRevenueSubsidyPf,
    tolerance = 0.01,
  ): void {
    const d = mapped.data;
    const expectedCr = d.overallImprovement / REVENUE_SUBSIDY_PF_CR_DIVISOR;
    expect(Math.abs(d.overallImprovementCr - expectedCr)).toBeLessThanOrEqual(
      tolerance,
    );

    if (d.billCount > 0 && d.avgImprovement != null) {
      const expectedAvg = d.overallImprovement / d.billCount;
      expect(Math.abs(d.avgImprovement - expectedAvg)).toBeLessThanOrEqual(
        tolerance,
      );
    }
  }

  /** Response fields echo the save request (derived fields not in body). */
  validateSaveEcho(
    mapped: MappedRevenueSubsidyPf,
    request: RevenueSubsidyPfSaveRequest,
  ): void {
    const d = mapped.data;
    expect(d.periodYear).toBe(request.periodYear);
    expect(d.periodMonth).toBe(request.periodMonth);
    expect(d.billingAvailability).toEqual(request.billingAvailability);
    expect(d.billingEfficiency).toEqual(request.billingEfficiency);
    expect(d.revenueGainedRpu).toEqual(request.revenueGainedRpu);
    expect(d.subsidyAmount).toBe(request.subsidyAmount);
    expect(d.incentivePf).toEqual(request.incentivePf);
    expect(d.penaltyPf).toEqual(request.penaltyPf);
    expect(d.billCount).toBe(request.billCount);
  }

  validateLiveOk(mapped: MappedRevenueSubsidyPf): void {
    this.validateSuccess(mapped.success);
    if (!mapped.hasRecord) {
      return;
    }
    this.validatePeriod(mapped);
    this.validateDataShape(mapped);
    this.validateDerivedFields(mapped);
  }

  validateSaveOk(
    mapped: MappedRevenueSubsidyPf,
    request: RevenueSubsidyPfSaveRequest,
  ): void {
    this.validateLiveOk(mapped);
    this.validateSaveEcho(mapped, request);
    expect(mapped.message).toBe(revenueSubsidyPfSaveSuccessMessage);
  }

  validateScenario(
    mapped: MappedRevenueSubsidyPf,
    scenario: RevenueSubsidyPfScenario,
    request?: RevenueSubsidyPfSaveRequest | null,
  ): void {
    switch (scenario) {
      case "dev_live_primary":
        this.validateLiveOk(mapped);
        break;
      case "dev_reject_unknown_query":
        // Handled via validateUnknownQueryValidationError on error body.
        break;
      case "dev_live_save_isolated":
        if (!request) {
          throw new Error("dev_live_save_isolated requires save request");
        }
        this.validateSaveOk(mapped, request);
        break;
      case "contract_live_sample":
      case "contract_derived_fields":
        this.validateLiveOk(mapped);
        break;
      case "contract_zero_bills":
        this.validateSuccess(mapped.success);
        this.validatePeriod(mapped);
        this.validateDataShape(mapped);
        expect(mapped.data.billCount).toBe(0);
        expect(mapped.data.overallImprovement).toBe(0);
        expect(mapped.data.avgImprovement).toBeNull();
        expect(mapped.data.overallImprovementCr).toBe(0);
        break;
      case "contract_save_zero_period":
        this.validateSuccess(mapped.success);
        this.validatePeriod(mapped);
        this.validateDataShape(mapped);
        expect(mapped.message).toBe(revenueSubsidyPfSaveSuccessMessage);
        expect(mapped.data.periodYear).toBe(2100);
        expect(mapped.data.periodMonth).toBe(12);
        expect(mapped.data.billCount).toBe(0);
        expect(mapped.data.avgImprovement).toBeNull();
        if (request) {
          this.validateSaveEcho(mapped, request);
        }
        break;
      default: {
        const _exhaustive: never = scenario;
        void _exhaustive;
      }
    }
  }

  validateUnauthorizedError(error: RevenueSubsidyPfErrorResponse): void {
    expect(error.success).toBe(false);
    expect(error.error.code).toBe(dtrUnbalanceUnauthorizedCode);
    expect(error.error.message).toBe(revenueSubsidyPfUnauthorizedMessage);
  }

  validateAccessTokenInvalidError(error: RevenueSubsidyPfErrorResponse): void {
    expect(error.success).toBe(false);
    expect(error.error.code).toBe(dtrUnbalanceAccessTokenInvalidCode);
    expect(error.error.message).toBe(revenueSubsidyPfAccessTokenInvalidMessage);
  }

  validateUnknownQueryValidationError(error: RevenueSubsidyPfErrorResponse): void {
    expect(error.success).toBe(false);
    expect(error.error.code).toBe("VALIDATION_ERROR");
    expect(String(error.error.message).toLowerCase()).toMatch(
      /unrecognized key/i,
    );
  }
}
