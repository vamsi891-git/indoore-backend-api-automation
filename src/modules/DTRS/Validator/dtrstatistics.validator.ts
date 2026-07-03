import { expect } from "@playwright/test";
import { dtrStatisticsData } from "../Data/dtrstatistics.data";

type StatisticCard = {
    title: string;
    value: string;
    subtitle: string | null;
    trendPercent: number | null;
};

export class DtrStatisticsValidator {
    // =========================================
    // RESPONSE ENVELOPE
    // =========================================
    validateResponseEnvelope(response: { success: boolean; data: unknown }): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
    }

    // =========================================
    // CARD COUNT
    // =========================================
    validateCardCount(cards: StatisticCard[]): void {
        expect(cards.length).toBe(10);
    }

    // =========================================
    // CARD STRUCTURE
    // =========================================
    validateCardStructure(cards: StatisticCard[]): void {
        cards.forEach((card) => {
            expect(card).toHaveProperty("title");
            expect(card).toHaveProperty("value");
            expect(card).toHaveProperty("subtitle");
            expect(card).toHaveProperty("trendPercent");
        });
    }

    // =========================================
    // REQUIRED TITLES (ORDER)
    // =========================================
    validateCardTitles(cards: StatisticCard[]): void {
        const titles = cards.map((card) => card.title);
        expect(titles).toEqual([...dtrStatisticsData.expectedCardTitles]);
    }

    // =========================================
    // FIXED SUBTITLES (BACKEND buildStatisticCards)
    // =========================================
    validateExpectedSubtitles(cards: StatisticCard[]): void {
        for (const [title, expectedSubtitle] of Object.entries(
            dtrStatisticsData.expectedSubtitles,
        )) {
            const card = cards.find((c) => c.title === title);
            expect(card).toBeDefined();
            expect(card!.subtitle).toBe(expectedSubtitle);
        }

        const status = cards.find((c) => c.title === "Status");
        expect(status).toBeDefined();
        expect(typeof status!.subtitle).toBe("string");
    }

    // =========================================
    // VALUE VALIDATION
    // =========================================
    validateValues(cards: StatisticCard[]): void {
        cards.forEach((card) => {
            expect(card.value).not.toBeUndefined();
            expect(card.value).not.toBeNull();
            expect(typeof card.value).toBe("string");
            expect(card.value.length).toBeGreaterThan(0);
        });
    }

    // =========================================
    // TREND PERCENT — only on power/energy cards
    // calcTrend: null when curr/prev null or prev === 0
    // =========================================
    validateTrendPercent(cards: StatisticCard[]): void {
        const trendTitles = new Set<string>(dtrStatisticsData.cardsWithTrend);

        cards.forEach((card) => {
            if (trendTitles.has(card.title)) {
                if (card.trendPercent !== null) {
                    expect(typeof card.trendPercent).toBe("number");
                    expect(Number.isInteger(card.trendPercent)).toBeTruthy();
                }
            } else {
                expect(card.trendPercent).toBeNull();
            }
        });
    }

    // =========================================
    // POWER ON / OFF — HH:MM:SS clock format
    // Power Off is always "00:00:00" in backend
    // =========================================
    validatePowerFormat(cards: StatisticCard[]): void {
        const powerOn = cards.find((x) => x.title === "Power On");
        const powerOff = cards.find((x) => x.title === "Power Off");
        expect(powerOn).toBeDefined();
        expect(powerOff).toBeDefined();
        expect(powerOn!.value).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        expect(powerOff!.value).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        expect(powerOff!.value).toBe("00:00:00");
    }

    // =========================================
    // STATUS CARD — Limited | Under Load + load limit subtitle
    // =========================================
    validateStatusCard(cards: StatisticCard[]): void {
        const status = cards.find((x) => x.title === "Status");
        expect(status).toBeDefined();
        expect([...dtrStatisticsData.statusValues]).toContain(status!.value);
        expect(typeof status!.subtitle).toBe("string");
        expect(status!.subtitle).toMatch(/^\d+(\.\d{2})?$/);
        expect(status!.trendPercent).toBeNull();
    }

    // =========================================
    // DECIMAL FORMATS — KW/KWh/KVAh use toFixed(2); KVA uses fmtKva
    // =========================================
    validateDecimalFormats(cards: StatisticCard[]): void {
        const kw = cards.find((x) => x.title === "Total KW");
        const kwh = cards.find((x) => x.title === "Total KWh");
        const kvah = cards.find((x) => x.title === "Total KVAh");
        const kva = cards.find((x) => x.title === "Total KVA");

        expect(kw!.value).toMatch(/^\d+\.\d{2}$/);
        expect(kwh!.value).toMatch(/^\d+\.\d{2}$/);
        expect(kvah!.value).toMatch(/^\d+\.\d{2}$/);
        expect(kva!.value).toMatch(/^\d+$|^\d+\.\d{2}$/);
    }

    // =========================================
    // INTEGER COUNT CARDS
    // =========================================
    validateIntegerCountCards(cards: StatisticCard[]): void {
        const feeders = cards.find((x) => x.title === "Total LT Feeders");
        const fuseBlown = cards.find((x) => x.title === "LT Feeders Fuse Blown");

        expect(feeders!.value).toMatch(/^\d+$/);
        expect(Number(feeders!.value)).toBeGreaterThanOrEqual(0);

        expect(fuseBlown!.value).toMatch(/^\d+$/);
        expect(Number(fuseBlown!.value)).toBeGreaterThanOrEqual(0);
    }

    // =========================================
    // UNBALANCED FEEDERS — "0" or "N%" (one decimal max)
    // calculateUnbalance: Math.round((maxDev/avg)*1000)/10
    // =========================================
    validateUnbalancedFeeders(cards: StatisticCard[]): void {
        const unbalanced = cards.find((x) => x.title === "Unbalanced LT Feeders");
        expect(unbalanced).toBeDefined();
        expect(unbalanced!.value === "0" || /^\d+(\.\d)?%$/.test(unbalanced!.value)).toBeTruthy();
        expect(unbalanced!.trendPercent).toBeNull();
    }

    // =========================================
    // SUBTITLE TYPE
    // =========================================
    validateSubtitles(cards: StatisticCard[]): void {
        cards.forEach((card) => {
            if (card.subtitle !== null) {
                expect(typeof card.subtitle).toBe("string");
            }
        });
    }

    // =========================================
    // BACKEND FALLBACK — null readings become "0" / "0.00"
    // =========================================
    validateFallbackValues(cards: StatisticCard[]): void {
        const kw = cards.find((x) => x.title === "Total KW");
        const kva = cards.find((x) => x.title === "Total KVA");
        const kwh = cards.find((x) => x.title === "Total KWh");
        const kvah = cards.find((x) => x.title === "Total KVAh");

        expect(kw!.value).not.toBe("");
        expect(kva!.value).not.toBe("");
        expect(kwh!.value).not.toBe("");
        expect(kvah!.value).not.toBe("");
    }

    // =========================================
    // BUSINESS RULES
    // =========================================
    validateBusinessRules(cards: StatisticCard[]): void {
        const status = cards.find((x) => x.title === "Status");
        const powerOff = cards.find((x) => x.title === "Power Off");

        expect(powerOff!.value).toBe("00:00:00");

        if (status!.value === "Limited") {
            expect(Number(status!.subtitle)).toBeGreaterThanOrEqual(0);
        }

        if (status!.value === "Under Load") {
            expect(status!.subtitle).toMatch(/^\d+(\.\d{2})?$/);
        }
    }

    // =========================================
    // NON-NEGATIVE NUMERIC VALUES
    // =========================================
    validateNonNegativeNumericValues(cards: StatisticCard[]): void {
        const kw = cards.find((x) => x.title === "Total KW");
        const kva = cards.find((x) => x.title === "Total KVA");
        const kwh = cards.find((x) => x.title === "Total KWh");
        const kvah = cards.find((x) => x.title === "Total KVAh");

        expect(parseFloat(kw!.value)).toBeGreaterThanOrEqual(0);
        expect(parseFloat(kva!.value)).toBeGreaterThanOrEqual(0);
        expect(parseFloat(kwh!.value)).toBeGreaterThanOrEqual(0);
        expect(parseFloat(kvah!.value)).toBeGreaterThanOrEqual(0);
    }
}
