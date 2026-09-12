import { expect } from "@playwright/test";
export class BillingPeriodValidator {
    validateMonthlyConsumption(data: any): void {
        const monthly = data.monthlyConsumption;
        expect(monthly.title).toBe("Monthly Consumption");
        expect(
            monthly.valueKwh === null || typeof monthly.valueKwh === "number",
        ).toBeTruthy();
        if (typeof monthly.valueKwh === "number") {
            expect(monthly.valueKwh).toBeGreaterThanOrEqual(0);
        }
        expect(
            monthly.trendPercent === null ||
                typeof monthly.trendPercent === "number",
        ).toBeTruthy();
        expect(monthly.comparisonLabel).toContain("Last month");
    }
    validateDailyConsumption(data: any): void {
        const daily = data.dailyConsumption;
        expect(daily.title).toBe("Daily Consumption");
        expect(
            daily.valueKwh === null || typeof daily.valueKwh === "number",
        ).toBeTruthy();
        if (typeof daily.valueKwh === "number") {
            expect(daily.valueKwh).toBeGreaterThanOrEqual(0);
        }
        expect(
            daily.trendPercent === null ||
                typeof daily.trendPercent === "number",
        ).toBeTruthy();
        expect(
            /Yesterday|Previous day/i.test(String(daily.comparisonLabel ?? "")),
        ).toBeTruthy();
    }
    validateOutstanding(data: any): void {
        const outstanding = data.totalOutstanding;
        expect(outstanding.title).toBe("Total Outstanding");
        if (outstanding.amountInr !== null) {
            expect(typeof outstanding.amountInr).toBe("number");
            expect(outstanding.amountInr).toBeGreaterThanOrEqual(0);
        }
    }
    validateBillStatus(data: any): void {
        const bill = data.billStatus;
        expect(bill.title).toBe("Bill Status");
        if (bill.status !== null) {
            expect([
                "Paid",
                "Pending",
                "Overdue",
                "Unpaid",
                "Unknown",
            ]).toContain(bill.status);
        }
    }
    /*
    backend fallback validation
    */
    validateFallbackLogic(data: any): void {
        expect(data.monthlyConsumption).toBeDefined();
        expect(data.dailyConsumption).toBeDefined();
        expect(data.totalOutstanding).toBeDefined();
        expect(data.billStatus).toBeDefined();
    }
    /*
    backend trend validation
    */
    validateTrendPercent(data: any): void {
        const monthly = data.monthlyConsumption;
        const daily = data.dailyConsumption;
        if (monthly.trendPercent != null) {
            expect(monthly.trendPercent).toBeGreaterThanOrEqual(-100);
        }
        if (daily.trendPercent != null) {
            expect(daily.trendPercent).toBeGreaterThanOrEqual(-100);
        }
    }
    /*
    cross validations
    */
    validateBusinessRules(data: any): void {
        expect(data.monthlyConsumption.title).not.toEqual(data.dailyConsumption.title);
        if (data.monthlyConsumption.valueKwh != null) {
            expect(data.monthlyConsumption.valueKwh).toBeGreaterThanOrEqual(0);
        }
        if (data.dailyConsumption.valueKwh != null) {
            expect(data.dailyConsumption.valueKwh).toBeGreaterThanOrEqual(0);
        }
    }
}