import { expect } from "@playwright/test";
export class BillingPeriodValidator {
    validateMonthlyConsumption(data: any): void {
        const monthly = data.monthlyConsumption;
        expect(monthly.title).toBe("Monthly Consumption");
        expect(typeof monthly.valueKwh).toBe("number");
        expect(monthly.valueKwh).toBeGreaterThanOrEqual(0);
        expect(typeof monthly.trendPercent).toBe("number");
        expect(monthly.comparisonLabel).toContain("Last month");
    }
    validateDailyConsumption(data: any): void {
        const daily = data.dailyConsumption;
        expect(daily.title).toBe("Daily Consumption");
        expect(typeof daily.valueKwh).toBe("number");
        expect(daily.valueKwh).toBeGreaterThanOrEqual(0);
        expect(typeof daily.trendPercent).toBe("number");
        expect(daily.comparisonLabel).toContain("Yesterday");
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
            expect(["Paid","Pending","Overdue","Unpaid"]).toContain(bill.status);
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
        expect(monthly.trendPercent).toBeGreaterThanOrEqual(-100);
        expect(daily.trendPercent).toBeGreaterThanOrEqual(-100);
    }
    /*
    cross validations
    */
    validateBusinessRules(data: any): void {
        expect(data.monthlyConsumption.title).not.toEqual(data.dailyConsumption.title);
        expect(data.monthlyConsumption.valueKwh).toBeGreaterThanOrEqual(0);
        expect(data.dailyConsumption.valueKwh).toBeGreaterThanOrEqual(0);
    }
}