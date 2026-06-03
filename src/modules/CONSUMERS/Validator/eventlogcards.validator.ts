import { expect } from "@playwright/test";
export class EventLogCardsValidator {
    // =========================================
    // RESOLVED EVENTS
    // =========================================
    validateResolvedEvents(data: any): void {
        const resolved =data.resolvedEvents;
        expect(resolved.title).toBe("Resolved Events");
        expect(typeof resolved.value).toBe("number");
        expect(resolved.value).toBeGreaterThanOrEqual(0);
        expect(typeof resolved.trendPercent).toBe("number");
    }
    // =========================================
    // PENDING EVENTS
    // =========================================
    validatePendingEvents(data: any): void {
        const pending =data.pendingEvents;
        expect(pending.title).toBe("Pending Events");
        expect(typeof pending.value).toBe("number");
        expect(pending.value).toBeGreaterThanOrEqual(0);
        expect(typeof pending.trendPercent).toBe("number");
    }
    // =========================================
    // AVG RESOLUTION TIME
    // =========================================
    validateAvgResolutionTime(data: any): void {
        const avg = data.avgResolutionTime;
        expect( avg.title).toBe("Avg Resolution Time");
        expect( typeof avg.valueMinutes).toBe("number");
        expect( avg.valueMinutes).toBeGreaterThanOrEqual(0);
        expect( avg.valueDisplay).toContain("m");
        expect(typeof avg.trendPercent).toBe("number");
    }
    // =========================================
    // BACKEND FALLBACK VALIDATION
    // =========================================
    validateFallbackLogic(data: any): void {
        expect(data.resolvedEvents).toBeDefined();
        expect(data.pendingEvents).toBeDefined();
        expect(data.avgResolutionTime).toBeDefined();
    }
    // =========================================
    // TREND VALIDATION
    // =========================================
    validateTrendPercent(data: any): void {
        expect(data.resolvedEvents.trendPercent).toBeGreaterThanOrEqual(-100);
        expect(data.pendingEvents.trendPercent).toBeGreaterThanOrEqual(-100);
        expect(data.avgResolutionTime.trendPercent).toBeGreaterThanOrEqual(-100);
    }
    // =========================================
    // BUSINESS RULES
    // =========================================
    validateBusinessRules(data: any): void {
        expect(data.resolvedEvents.title).not.toEqual(data.pendingEvents.title);
        expect(data.avgResolutionTime.valueDisplay).toContain("m");
        expect(data.resolvedEvents.value).toBeGreaterThanOrEqual(0);
        expect(data.pendingEvents.value).toBeGreaterThanOrEqual(0);
    }
}