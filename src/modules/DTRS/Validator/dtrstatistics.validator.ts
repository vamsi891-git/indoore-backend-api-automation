import { expect } from "@playwright/test";
export class DtrStatisticsValidator {

    // =========================================
    // CARD COUNT
    // =========================================
    validateCardCount(cards: any[]): void {
        expect(cards.length).toBe(10);
    }

    // =========================================
    // REQUIRED TITLES
    // =========================================
    validateCardTitles(cards: any[]): void {
        const titles =cards.map(card => card.title);
        expect(titles).toEqual(["Total LT Feeders","Total KW","Total KVA","Total KWh","Total KVAh","LT Feeders Fuse Blown","Unbalanced LT Feeders","Power On","Power Off","Status"]);
    }
    // =========================================
    // VALUE VALIDATION
    // =========================================
    validateValues(cards: any[]): void {
        cards.forEach(card => {
            expect(card.value).not.toBeUndefined();
            expect(card.value).not.toBeNull();
            expect(typeof card.value).toBe("string");
        });
    }
    // =========================================
    // TREND PERCENT VALIDATION
    // =========================================
    validateTrendPercent(cards: any[]): void {
        cards.forEach(card => {
            if (card.trendPercent !== null) {
                expect(typeof card.trendPercent).toBe("number");
                expect(card.trendPercent).toBeGreaterThanOrEqual(-100);
            }
        });
    }
    // =========================================
    // POWER FORMAT VALIDATION
    // =========================================
    validatePowerFormat(cards: any[]): void {
        const powerOn =cards.find(x => x.title === "Power On");
        const powerOff =cards.find(x => x.title === "Power Off")
        expect(powerOn.value).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        expect(powerOff.value).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    }
    // =========================================
    // STATUS CARD VALIDATION
    // =========================================
    validateStatusCard(cards: any[]): void {
        const status =cards.find(x => x.title === "Status");
        expect(["Limited","Under Load"]).toContain(status.value);
        expect(typeof status.subtitle).toBe("string");
    }
    // =========================================
    // DECIMAL FORMAT VALIDATION
    // =========================================
    validateDecimalFormats(cards: any[]): void {
        const kw = cards.find(  x => x.title === "Total KW" );
        const kwh =cards.find(x => x.title === "Total KWh");
        const kvah =cards.find(x => x.title === "Total KVAh");
        expect(kw.value).toMatch(/^\d+(\.\d{2})?$/);
        expect(kwh.value).toMatch(/^\d+(\.\d{2})?$/);
        expect(kvah.value).toMatch(/^\d+(\.\d{2})?$/);
    }
    // =========================================
    // UNBALANCED FEEDERS VALIDATION
    // =========================================
    validateUnbalancedFeeders(cards: any[]): void {
        const unbalanced =cards.find(x =>x.title ==="Unbalanced LT Feeders");
        expect(typeof unbalanced.value).toBe("string");
        if (unbalanced.value.includes("%")) {
            expect(unbalanced.value).toMatch(/^\d+(\.\d+)?%$/);
        }
    }
    // =========================================
    // SUBTITLE VALIDATION
    // =========================================
    validateSubtitles(cards: any[]): void {
        cards.forEach(card => {
            if (card.subtitle !== null) {
                expect(typeof card.subtitle).toBe("string");
            }
        });
    }
    // =========================================
    // BACKEND FALLBACK LOGIC
    // =========================================
    validateFallbackValues(cards: any[]): void {
        cards.forEach(card => {
            expect(card.value).not.toBeUndefined();
            expect(card.title).not.toBeUndefined();
        });
    }
    // =========================================
    // BUSINESS RULES
    // =========================================
    validateBusinessRules(cards: any[]): void {
        const status =cards.find(x => x.title === "Status");
        if (status.value === "Limited") {
            expect(Number(status.subtitle)).toBeGreaterThan(0);
        }
        const feeder =cards.find(x =>x.title ==="Total LT Feeders");
        expect(Number(feeder.value)).toBeGreaterThanOrEqual(0);
    }
}