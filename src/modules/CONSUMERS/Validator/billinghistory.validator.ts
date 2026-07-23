import { expect } from "@playwright/test";
import {
  BILLING_HISTORY_DEFAULT_SPAN_MONTHS,
  BILLING_HISTORY_EMPTY_FALLBACK_SPAN_MONTHS,
  BILLING_HISTORY_MAX_ARCHIVE_PERIODS,
  billingHistoryContractConsumptionFormulaMeta,
} from "../Data/billinghistory.data";
import type {
  BillingHistoryErrorResponse,
  BillingHistoryRow,
  BillingHistoryScenario,
  MappedBillingHistory,
} from "../Mapper/billinghistory.mapper";

const PERIOD_LABEL_LONG_MONTH = /^[A-Za-z]+\s+\d{4}$/;
const CONSUMPTION_SUMMARY =
  /^[\d,]+(\.\d{1,2})?\s+KWH Consumed$/i;
const EM_DASH = "—";

/** Mirrors backend roundEnergy. */
function roundEnergy(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Mirrors backend scaleBillingArchiveCumulativeKwh (÷ 1000). */
function scaleBillingArchiveCumulativeKwh(importKwhRaw: number): number {
  return importKwhRaw / 1000;
}

/** Mirrors backend formatConsumptionSummary. */
function formatConsumptionSummary(kwh: number | null): string {
  if (kwh == null || !Number.isFinite(kwh)) {
    return "";
  }
  const rounded = roundEnergy(kwh);
  const parts = rounded.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return `${parts} KWH Consumed`;
}

function parsePeriodLabel(label: string | null): number | null {
  if (!label?.trim()) {
    return null;
  }
  const parsed = Date.parse(`1 ${label.trim()}`);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Mirrors backend mapSlimBillingHistory period delta:
 * max(0, roundEnergy(cum − prevCum)) when both cumulatives exist; else 0.
 */
function billingPeriodKwhFromArchive(
  importKwhRaw: number,
  prevImportKwhRaw: number | null,
): number {
  const cum = scaleBillingArchiveCumulativeKwh(importKwhRaw);
  const prevCum =
    prevImportKwhRaw == null
      ? null
      : scaleBillingArchiveCumulativeKwh(prevImportKwhRaw);
  if (cum == null || prevCum == null) {
    return 0;
  }
  return roundEnergy(Math.max(0, cum - prevCum));
}

export class BillingHistoryValidator {
  validateSuccess(success: boolean) {
    expect(success).toBeTruthy();
  }

  validateNotFoundError(responseBody: BillingHistoryErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("CONSUMER_NOT_FOUND");
    expect(responseBody.error.message.toLowerCase()).toContain(
      "consumer not found",
    );
  }

  validateBlankRefError(responseBody: BillingHistoryErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toContain("ivrsno");
    const fieldErrors = responseBody.error.details?.fieldErrors?.ivrsNo;
    expect(Array.isArray(fieldErrors) && fieldErrors.length > 0).toBeTruthy();
  }

  validateInvalidBillingLimitError(responseBody: BillingHistoryErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toContain("billinglimit");
    const fieldErrors = responseBody.error.details?.fieldErrors?.billingLimit;
    expect(Array.isArray(fieldErrors) && fieldErrors.length > 0).toBeTruthy();
  }

  validateRootStructure(items: BillingHistoryRow[]) {
    expect(Array.isArray(items)).toBeTruthy();
  }

  validateRowCount(items: BillingHistoryRow[], expectedCount: number) {
    expect(items.length).toBe(expectedCount);
  }

  validateRowRequiredFields(items: BillingHistoryRow[]) {
    const fields = [
      "periodLabel",
      "consumptionKwh",
      "billAmount",
      "consumptionSummaryText",
      "paymentStatus",
    ] as const;
    for (const item of items) {
      for (const field of fields) {
        expect(item).toHaveProperty(field);
      }
    }
  }

  validateRowStructure(items: BillingHistoryRow[]) {
    for (const item of items) {
      expect(
        item.periodLabel === null || typeof item.periodLabel === "string",
      ).toBeTruthy();
      expect(
        item.consumptionKwh === null ||
          typeof item.consumptionKwh === "number",
      ).toBeTruthy();
      expect(
        item.billAmount === null || typeof item.billAmount === "number",
      ).toBeTruthy();
      expect(typeof item.consumptionSummaryText).toBe("string");
      expect(
        item.paymentStatus === null ||
          typeof item.paymentStatus === "string",
      ).toBeTruthy();
    }
  }

  validatePeriodLabel(items: BillingHistoryRow[]) {
    for (const item of items) {
      expect(item.periodLabel).toBeTruthy();
      expect(item.periodLabel!.trim().length).toBeGreaterThan(0);
      expect(PERIOD_LABEL_LONG_MONTH.test(item.periodLabel!.trim())).toBeTruthy();
    }
  }

  validateConsumptionKwh(items: BillingHistoryRow[]) {
    for (const item of items) {
      if (item.consumptionKwh == null) {
        continue;
      }
      expect(Number.isFinite(item.consumptionKwh)).toBeTruthy();
      expect(item.consumptionKwh).toBeGreaterThanOrEqual(0);
      expect(item.consumptionKwh).toBe(roundEnergy(item.consumptionKwh));
    }
  }

  validateBillAmountStub(items: BillingHistoryRow[]) {
    for (const item of items) {
      expect(item.billAmount).toBeNull();
    }
  }

  validatePaymentStatusStub(items: BillingHistoryRow[]) {
    for (const item of items) {
      expect(item.paymentStatus).toBeNull();
    }
  }

  validateEmptyMonthRow(item: BillingHistoryRow) {
    expect(item.consumptionKwh).toBeNull();
    expect(item.billAmount).toBeNull();
    expect(item.consumptionSummaryText).toBe(EM_DASH);
    expect(item.paymentStatus).toBeNull();
  }

  validateConsumptionSummaryText(items: BillingHistoryRow[]) {
    for (const item of items) {
      if (item.consumptionKwh == null) {
        expect(item.consumptionSummaryText).toBe(EM_DASH);
        continue;
      }
      expect(CONSUMPTION_SUMMARY.test(item.consumptionSummaryText)).toBeTruthy();
    }
  }

  validateSummaryExactBackendFormat(items: BillingHistoryRow[]) {
    for (const item of items) {
      if (item.consumptionKwh == null) {
        expect(item.consumptionSummaryText).toBe(EM_DASH);
        continue;
      }
      expect(item.consumptionSummaryText).toBe(
        formatConsumptionSummary(item.consumptionKwh),
      );
    }
  }

  validateUniquePeriodLabels(items: BillingHistoryRow[]) {
    const labels = items
      .map((item) => item.periodLabel?.trim())
      .filter((label): label is string => Boolean(label));
    if (labels.length < 2) {
      return;
    }
    expect(new Set(labels).size).toBe(labels.length);
  }

  validateDescendingPeriodOrder(items: BillingHistoryRow[]) {
    if (items.length < 2) {
      return;
    }
    for (let i = 0; i < items.length - 1; i++) {
      const current = parsePeriodLabel(items[i]!.periodLabel);
      const next = parsePeriodLabel(items[i + 1]!.periodLabel);
      expect(current).not.toBeNull();
      expect(next).not.toBeNull();
      expect(current!).toBeGreaterThanOrEqual(next!);
    }
  }

  validateContractFixture(
    mapped: MappedBillingHistory,
    expectedCount: number,
  ) {
    this.validateSuccess(mapped.success);
    this.validateRootStructure(mapped.items);
    this.validateRowCount(mapped.items, expectedCount);
    this.validateRowRequiredFields(mapped.items);
    this.validateRowStructure(mapped.items);
    this.validatePeriodLabel(mapped.items);
    this.validateConsumptionKwh(mapped.items);
    this.validateBillAmountStub(mapped.items);
    this.validatePaymentStatusStub(mapped.items);
    this.validateConsumptionSummaryText(mapped.items);
    this.validateSummaryExactBackendFormat(mapped.items);
    this.validateUniquePeriodLabels(mapped.items);
    this.validateDescendingPeriodOrder(mapped.items);
  }

  validateEmptyContract(mapped: MappedBillingHistory, expectedCount: number) {
    this.validateContractFixture(mapped, expectedCount);
    for (const item of mapped.items) {
      this.validateEmptyMonthRow(item);
    }
  }

  validateNonzeroConsumptionContract(mapped: MappedBillingHistory) {
    this.validateContractFixture(mapped, 3);

    const february = mapped.items.find((row) => row.periodLabel === "February 2026");
    expect(february?.consumptionKwh).toBe(150);
    expect(february?.consumptionSummaryText).toBe("150 KWH Consumed");

    const january = mapped.items.find((row) => row.periodLabel === "January 2026");
    expect(january?.consumptionKwh).toBe(0);
    expect(january?.consumptionSummaryText).toBe("0 KWH Consumed");

    const march = mapped.items.find((row) => row.periodLabel === "March 2026");
    expect(march?.consumptionKwh).toBe(0);
    expect(march?.consumptionSummaryText).toBe("0 KWH Consumed");
  }

  /**
   * Proves billing-history period kWh from archive cumulative registers:
   * periodKwh = max(0, roundEnergy(cum − prevCum)) with cum = importKwh / 1000.
   */
  validateConsumptionFormulaContract(mapped: MappedBillingHistory) {
    this.validateNonzeroConsumptionContract(mapped);

    const { archiveRows } = billingHistoryContractConsumptionFormulaMeta;
    for (let i = 0; i < archiveRows.length; i++) {
      const row = archiveRows[i]!;
      const prevRaw = i > 0 ? archiveRows[i - 1]!.importKwhRaw : null;
      const expected = billingPeriodKwhFromArchive(row.importKwhRaw, prevRaw);

      const monthLabel = new Date(`${row.monthKey}-01T12:00:00+05:30`).toLocaleString(
        "en-IN",
        { month: "long", year: "numeric", timeZone: "Asia/Kolkata" },
      );
      const apiRow = mapped.items.find((item) => item.periodLabel === monthLabel);
      expect(apiRow?.consumptionKwh).toBe(expected);
      if (apiRow?.consumptionKwh != null) {
        expect(apiRow.consumptionSummaryText).toBe(
          formatConsumptionSummary(apiRow.consumptionKwh),
        );
      }
    }

    const totalDelta = archiveRows.reduce((sum, row, index) => {
      const prevRaw = index > 0 ? archiveRows[index - 1]!.importKwhRaw : null;
      return sum + billingPeriodKwhFromArchive(row.importKwhRaw, prevRaw);
    }, 0);
    expect(totalDelta).toBe(150);
  }

  /**
   * Widget resilience — unknown consumer/meter routes may return HTTP 200 with
   * an empty IST calendar instead of 404 when meter context cannot be resolved.
   * Unresolved-meter empty calendars still use the legacy 24-month span.
   */
  validateGracefulEmptyFallback(
    mapped: MappedBillingHistory,
    billingLimit: number,
  ) {
    const expectedCount =
      billingLimit > 0
        ? billingLimit
        : BILLING_HISTORY_EMPTY_FALLBACK_SPAN_MONTHS;
    this.validateSuccess(mapped.success);
    this.validateRootStructure(mapped.items);
    this.validateRowCount(mapped.items, expectedCount);
    for (const item of mapped.items) {
      this.validateEmptyMonthRow(item);
    }
    this.validateDescendingPeriodOrder(mapped.items);
    this.validateUniquePeriodLabels(mapped.items);
  }

  validateLiveOk(mapped: MappedBillingHistory, billingLimit: number) {
    this.validateSuccess(mapped.success);
    this.validateRootStructure(mapped.items);

    // Backend: billingLimit>0 → newest N; billingLimit=0 → all archive (≤120).
    if (billingLimit > 0) {
      this.validateRowCount(mapped.items, billingLimit);
    } else {
      expect(mapped.items.length).toBeGreaterThan(0);
      expect(mapped.items.length).toBeLessThanOrEqual(
        BILLING_HISTORY_MAX_ARCHIVE_PERIODS,
      );
    }

    this.validateRowRequiredFields(mapped.items);
    this.validateRowStructure(mapped.items);
    this.validatePeriodLabel(mapped.items);
    this.validateConsumptionKwh(mapped.items);
    this.validateBillAmountStub(mapped.items);
    this.validatePaymentStatusStub(mapped.items);
    this.validateConsumptionSummaryText(mapped.items);
    this.validateSummaryExactBackendFormat(mapped.items);
    this.validateUniquePeriodLabels(mapped.items);
    this.validateDescendingPeriodOrder(mapped.items);
  }

  validateScenario(
    mapped: MappedBillingHistory,
    scenario: BillingHistoryScenario,
    billingLimit: number,
  ) {
    switch (scenario) {
      case "contract_empty_24":
        // Fixture name is legacy; body uses DEFAULT_SPAN (18) empty month rows.
        this.validateEmptyContract(
          mapped,
          BILLING_HISTORY_DEFAULT_SPAN_MONTHS,
        );
        break;
      case "contract_empty_12":
        this.validateEmptyContract(mapped, 12);
        break;
      case "contract_nonzero_consumption":
        this.validateNonzeroConsumptionContract(mapped);
        break;
      case "contract_consumption_formula":
        this.validateConsumptionFormulaContract(mapped);
        break;
      case "bh_by_ivrs_all":
      case "bh_limit_12":
      case "bh_limit_6":
      case "bh_by_account":
      case "bh_by_meter":
      case "bh_ignore_unknown_query":
        this.validateLiveOk(mapped, billingLimit);
        break;
      case "consumer_not_found":
        this.validateGracefulEmptyFallback(mapped, billingLimit);
        break;
      case "meter_not_found":
        this.validateGracefulEmptyFallback(mapped, billingLimit);
        break;
      default:
        break;
    }
  }
}
