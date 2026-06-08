import { expect } from "@playwright/test";
import { BillingHistoryRow } from "../Mapper/billinghistory.mapper";

const ROW_REQUIRED_FIELDS = [
    "periodLabel",
    "consumptionKwh",
    "billAmount",
    "consumptionSummaryText",
    "paymentStatus",
] as const;

const PERIOD_LABEL_LONG_MONTH = /^[A-Za-z]+\s+\d{4}$/;

const CONSUMPTION_SUMMARY =
    /^[\d,]+(\.\d{1,2})?\s+KWH Consumed$/i;

function parsePeriodLabel(label: string | null): number | null {
    if (!label?.trim()) {
        return null;
    }
    const parsed = Date.parse(`1 ${label.trim()}`);
    return Number.isNaN(parsed) ? null : parsed;
}

/** Mirrors backend `formatConsumptionSummary`. */
function expectedConsumptionSummary(kwh: number | null): string {
    if (kwh == null || !Number.isFinite(kwh)) {
        return "";
    }
    const rounded = Math.round(kwh * 100) / 100;
    const parts = rounded.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    });
    return `${parts} KWH Consumed`;
}

export class BillingHistoryValidator {
    private hasData(items: BillingHistoryRow[]): boolean {
        return items.length > 0;
    }

    validateSuccess(success: boolean) {
        expect(success).toBeTruthy();
    }

    validateRootStructure(items: BillingHistoryRow[]) {
        expect(Array.isArray(items)).toBeTruthy();
    }

    validateEmptyScenario(items: BillingHistoryRow[]) {
        if (!this.hasData(items)) {
            expect(items).toEqual([]);
        }
    }

    validateItemsPresentWhenNonEmpty(items: BillingHistoryRow[]) {
        if (this.hasData(items)) {
            expect(items.length).toBeGreaterThan(0);
        }
    }

    validateDataPresentContract(items: BillingHistoryRow[]) {
        if (!this.hasData(items)) {
            return;
        }
        expect(items.length).toBeGreaterThan(0);
        const labeledRows = items.filter((item) => item.periodLabel?.trim());
        expect(labeledRows.length).toBeGreaterThan(0);
    }

    validateRowRequiredFields(items: BillingHistoryRow[]) {
        if (!this.hasData(items)) {
            return;
        }
        items.forEach((item) => {
            ROW_REQUIRED_FIELDS.forEach((field) => {
                expect(item).toHaveProperty(field);
            });
        });
    }

    validateRowStructure(items: BillingHistoryRow[]) {
        if (!this.hasData(items)) {
            return;
        }
        items.forEach((item) => {
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
        });
    }

    validatePeriodLabel(items: BillingHistoryRow[]) {
        if (!this.hasData(items)) {
            return;
        }
        items.forEach((item) => {
            expect(item.periodLabel).toBeTruthy();
            expect(item.periodLabel!.trim().length).toBeGreaterThan(0);
            expect(PERIOD_LABEL_LONG_MONTH.test(item.periodLabel!.trim())).toBeTruthy();
        });
    }

    validateConsumptionKwh(items: BillingHistoryRow[]) {
        if (!this.hasData(items)) {
            return;
        }
        items.forEach((item) => {
            if (item.consumptionKwh == null) {
                return;
            }
            expect(Number.isFinite(item.consumptionKwh)).toBeTruthy();
            expect(item.consumptionKwh).toBeGreaterThanOrEqual(0);
            const rounded = Math.round(item.consumptionKwh * 100) / 100;
            expect(item.consumptionKwh).toBe(rounded);
        });
    }

    validateBillAmountStub(items: BillingHistoryRow[]) {
        if (!this.hasData(items)) {
            return;
        }
        items.forEach((item) => {
            expect(item.billAmount).toBeNull();
        });
    }

    validatePaymentStatusStub(items: BillingHistoryRow[]) {
        if (!this.hasData(items)) {
            return;
        }
        items.forEach((item) => {
            expect(item.paymentStatus).toBeNull();
        });
    }

    validateConsumptionSummaryText(items: BillingHistoryRow[]) {
        if (!this.hasData(items)) {
            return;
        }
        items.forEach((item) => {
            if (item.consumptionKwh == null) {
                expect(item.consumptionSummaryText).toBe("");
                return;
            }
            expect(CONSUMPTION_SUMMARY.test(item.consumptionSummaryText)).toBeTruthy();
        });
    }

    validateSummaryExactBackendFormat(items: BillingHistoryRow[]) {
        if (!this.hasData(items)) {
            return;
        }
        items.forEach((item) => {
            expect(item.consumptionSummaryText).toBe(
                expectedConsumptionSummary(item.consumptionKwh),
            );
        });
    }

    validateSummaryMatchesConsumption(items: BillingHistoryRow[]) {
        if (!this.hasData(items)) {
            return;
        }
        items.forEach((item) => {
            if (item.consumptionKwh == null) {
                expect(item.consumptionSummaryText).toBe("");
                return;
            }
            const formatted = item.consumptionKwh.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
            });
            expect(item.consumptionSummaryText).toContain(formatted);
            expect(item.consumptionSummaryText.toUpperCase()).toContain(
                "KWH CONSUMED",
            );
        });
    }

    validateOldestBillingPeriodRule(items: BillingHistoryRow[]) {
        if (!this.hasData(items)) {
            return;
        }
        const oldest = items[items.length - 1];
        if (oldest.consumptionKwh == null) {
            expect(oldest.consumptionSummaryText).toBe("");
        }
    }

    validateUniquePeriodLabels(items: BillingHistoryRow[]) {
        if (!this.hasData(items)) {
            return;
        }
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
            const current = parsePeriodLabel(items[i].periodLabel);
            const next = parsePeriodLabel(items[i + 1].periodLabel);
            expect(current).not.toBeNull();
            expect(next).not.toBeNull();
            expect(current!).toBeGreaterThanOrEqual(next!);
        }
    }

    validateNaNValues(items: BillingHistoryRow[]) {
        if (!this.hasData(items)) {
            return;
        }
        items.forEach((item) => {
            if (item.consumptionKwh != null) {
                expect(Number.isNaN(item.consumptionKwh)).toBeFalsy();
            }
            if (item.billAmount != null) {
                expect(Number.isNaN(item.billAmount)).toBeFalsy();
            }
        });
    }

    validateBusinessRules(items: BillingHistoryRow[]) {
        if (!this.hasData(items)) {
            return;
        }
        items.forEach((item) => {
            if (item.consumptionKwh != null && item.consumptionKwh > 0) {
                expect(item.consumptionSummaryText.length).toBeGreaterThan(0);
            }
            if (item.consumptionKwh == null) {
                expect(item.consumptionSummaryText).toBe("");
            }
        });
    }

    /** Runs all backend row rules; fails fast when data is present. */
    validateDataPresentBackendRules(items: BillingHistoryRow[]) {
        if (!this.hasData(items)) {
            return;
        }
        this.validateDataPresentContract(items);
        this.validateRowRequiredFields(items);
        this.validateRowStructure(items);
        this.validatePeriodLabel(items);
        this.validateConsumptionKwh(items);
        this.validateBillAmountStub(items);
        this.validatePaymentStatusStub(items);
        this.validateConsumptionSummaryText(items);
        this.validateSummaryExactBackendFormat(items);
        this.validateOldestBillingPeriodRule(items);
        this.validateUniquePeriodLabels(items);
        this.validateDescendingPeriodOrder(items);
        this.validateNaNValues(items);
        this.validateBusinessRules(items);
    }
}
