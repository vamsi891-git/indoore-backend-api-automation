import { expect } from "@playwright/test";
import {
  dtrStatisticsCardsWithTrend,
  dtrStatisticsContractTrendFormulaMeta,
  dtrStatisticsExpectedCardTitles,
  dtrStatisticsExpectedSubtitles,
  dtrStatisticsStatusValues,
} from "../Data/dtrstatistics.data";
import type {
  DtrStatisticsErrorResponse,
  DtrStatisticsResponse,
  DtrStatisticsScenario,
  MappedDtrStatistics,
  StatisticCard,
} from "../Mapper/dtrstatistics.mapper";
import { EM_DASH } from "../utils/dtr-backend.util";

/** Mirrors backend calcTrend in buildStatisticCards. */
function calcTrend(curr: number | null, prev: number | null): number | null {
  if (curr == null || prev == null || prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

function findCard(cards: StatisticCard[], title: string): StatisticCard {
  const card = cards.find((c) => c.title === title);
  expect(card).toBeDefined();
  return card!;
}

export class DtrStatisticsValidator {
  validateSuccess(success: boolean): void {
    expect(success).toBeTruthy();
  }

  validateNotFoundError(responseBody: DtrStatisticsErrorResponse): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("DTR_NOT_FOUND");
    expect(responseBody.error.message.toLowerCase()).toContain("dtr not found");
  }

  validateBlankCodeError(responseBody: DtrStatisticsErrorResponse): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toMatch(
      /dtr|network|code/i,
    );
  }

  validateResponseEnvelope(response: DtrStatisticsResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateCardCount(cards: StatisticCard[]): void {
    expect(cards.length).toBe(10);
  }

  validateCardStructure(cards: StatisticCard[]): void {
    cards.forEach((card) => {
      expect(card).toHaveProperty("title");
      expect(card).toHaveProperty("value");
      expect(card).toHaveProperty("subtitle");
      expect(card).toHaveProperty("trendPercent");
    });
  }

  validateCardTitles(cards: StatisticCard[]): void {
    const titles = cards.map((card) => card.title);
    expect(titles).toEqual([...dtrStatisticsExpectedCardTitles]);
  }

  validateExpectedSubtitles(cards: StatisticCard[]): void {
    for (const [title, expectedSubtitle] of Object.entries(
      dtrStatisticsExpectedSubtitles,
    )) {
      const card = cards.find((c) => c.title === title);
      expect(card).toBeDefined();
      expect(card!.subtitle).toBe(expectedSubtitle);
    }

    const status = cards.find((c) => c.title === "Status");
    expect(status).toBeDefined();
    expect(typeof status!.subtitle).toBe("string");
  }

  validateValues(cards: StatisticCard[]): void {
    cards.forEach((card) => {
      expect(card.value).not.toBeUndefined();
      expect(card.value).not.toBeNull();
      expect(typeof card.value).toBe("string");
      expect(card.value.length).toBeGreaterThan(0);
    });
  }

  validateTrendPercent(cards: StatisticCard[]): void {
    const trendTitles = new Set<string>(dtrStatisticsCardsWithTrend);

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

  validatePowerFormat(cards: StatisticCard[]): void {
    const powerOn = findCard(cards, "Power On");
    const powerOff = findCard(cards, "Power Off");
    expect(powerOn.value).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(powerOff.value).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(powerOff.value).toBe("00:00:00");
  }

  validateStatusCard(cards: StatisticCard[]): void {
    const status = findCard(cards, "Status");
    expect([...dtrStatisticsStatusValues]).toContain(status.value);
    expect(typeof status.subtitle).toBe("string");
    expect(status.subtitle).toMatch(/^\d+(\.\d{2})?$/);
    expect(status.trendPercent).toBeNull();
  }

  validateDecimalFormats(cards: StatisticCard[]): void {
    const kw = findCard(cards, "Total KW");
    const kwh = findCard(cards, "Total KWh");
    const kvah = findCard(cards, "Total KVAh");
    const kva = findCard(cards, "Total KVA");

    expect(kw.value).toMatch(/^\d+\.\d{2}$/);
    expect(kwh.value).toMatch(/^\d+\.\d{2}$/);
    expect(kvah.value).toMatch(/^\d+\.\d{2}$/);
    expect(kva.value).toMatch(/^\d+$|^\d+\.\d{2}$/);
  }

  validateIntegerCountCards(cards: StatisticCard[]): void {
    const feeders = findCard(cards, "Total LT Feeders");
    const fuseBlown = findCard(cards, "LT Feeders Fuse Blown");

    expect(feeders.value).toMatch(/^\d+$/);
    expect(Number(feeders.value)).toBeGreaterThanOrEqual(0);
    expect(fuseBlown.value).toMatch(/^\d+$/);
    expect(Number(fuseBlown.value)).toBeGreaterThanOrEqual(0);
  }

  validateUnbalancedFeeders(cards: StatisticCard[]): void {
    const unbalanced = findCard(cards, "Unbalanced LT Feeders");
    expect(
      unbalanced.value === "0" ||
        unbalanced.value === "0%" ||
        /^\d+(\.\d)?%$/.test(unbalanced.value),
    ).toBeTruthy();
    expect(unbalanced.trendPercent).toBeNull();
  }

  validateSubtitles(cards: StatisticCard[]): void {
    cards.forEach((card) => {
      if (card.subtitle !== null) {
        expect(typeof card.subtitle).toBe("string");
      }
    });
  }

  validateNonNegativeNumericValues(cards: StatisticCard[]): void {
    const kw = findCard(cards, "Total KW");
    const kva = findCard(cards, "Total KVA");
    const kwh = findCard(cards, "Total KWh");
    const kvah = findCard(cards, "Total KVAh");

    expect(parseFloat(kw.value)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(kva.value)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(kwh.value)).toBeGreaterThanOrEqual(0);
    expect(parseFloat(kvah.value)).toBeGreaterThanOrEqual(0);
  }

  validateBusinessRules(cards: StatisticCard[]): void {
    const status = findCard(cards, "Status");
    const powerOff = findCard(cards, "Power Off");

    expect(powerOff.value).toBe("00:00:00");

    if (status.value === "Limited") {
      expect(Number(status.subtitle)).toBeGreaterThanOrEqual(0);
    }

    if (status.value === "Under Load") {
      expect(status.subtitle).toMatch(/^\d+(\.\d{2})?$/);
    }
  }

  validateLiveOk(mapped: MappedDtrStatistics): void {
    this.validateSuccess(mapped.success);
    this.validateCardCount(mapped.statisticCards);
    this.validateCardStructure(mapped.statisticCards);
    this.validateCardTitles(mapped.statisticCards);
    this.validateExpectedSubtitles(mapped.statisticCards);
    this.validateValues(mapped.statisticCards);
    this.validateIntegerCountCards(mapped.statisticCards);
    this.validateTrendPercent(mapped.statisticCards);
    this.validatePowerFormat(mapped.statisticCards);
    this.validateStatusCard(mapped.statisticCards);
    this.validateDecimalFormats(mapped.statisticCards);
    this.validateUnbalancedFeeders(mapped.statisticCards);
    this.validateSubtitles(mapped.statisticCards);
    this.validateNonNegativeNumericValues(mapped.statisticCards);
    this.validateBusinessRules(mapped.statisticCards);
  }

  validateRawDegradedEmDash(raw: DtrStatisticsResponse): void {
    this.validateResponseEnvelope(raw);
    const cards = raw.data!.statisticCards;
    this.validateCardTitles(cards);
    expect(findCard(cards, "Total LT Feeders").value).toBe("0");
    expect(findCard(cards, "LT Feeders Fuse Blown").value).toBe("0");
    expect(findCard(cards, "Total KW").value).toBe(EM_DASH);
    expect(findCard(cards, "Total KVA").value).toBe(EM_DASH);
    expect(findCard(cards, "Total KWh").value).toBe(EM_DASH);
    expect(findCard(cards, "Total KVAh").value).toBe(EM_DASH);
    expect(findCard(cards, "Unbalanced LT Feeders").value).toBe(EM_DASH);
    expect(findCard(cards, "Power On").value).toBe(EM_DASH);
    expect(findCard(cards, "Power Off").value).toBe(EM_DASH);
    expect(findCard(cards, "Status").value).toBe("Under Load");
    expect(findCard(cards, "Status").subtitle).toBe(EM_DASH);
    cards.forEach((card) => expect(card.trendPercent).toBeNull());
  }

  validateMappedDegradedFallback(mapped: MappedDtrStatistics): void {
    const cards = mapped.statisticCards;
    expect(findCard(cards, "Total KW").value).toBe("0.00");
    expect(findCard(cards, "Total KVA").value).toBe("0");
    expect(findCard(cards, "Total KWh").value).toBe("0.00");
    expect(findCard(cards, "Total KVAh").value).toBe("0.00");
    expect(findCard(cards, "Unbalanced LT Feeders").value).toBe("0");
    expect(findCard(cards, "Power On").value).toBe("00:00:00");
    expect(findCard(cards, "Power Off").value).toBe("00:00:00");
    expect(findCard(cards, "Status").subtitle).toBe("0");
    this.validateLiveOk(mapped);
  }

  validatePopulatedContract(mapped: MappedDtrStatistics): void {
    this.validateLiveOk(mapped);
    const cards = mapped.statisticCards;
    expect(findCard(cards, "Total LT Feeders").value).toBe("12");
    expect(findCard(cards, "Total KW").value).toBe("45.67");
    expect(findCard(cards, "Total KVA").value).toBe("50");
    expect(findCard(cards, "Total KWh").value).toBe("12345.78");
    expect(findCard(cards, "Total KVAh").value).toBe("13000.12");
    expect(findCard(cards, "LT Feeders Fuse Blown").value).toBe("2");
    expect(findCard(cards, "Unbalanced LT Feeders").value).toBe("8.5%");
    expect(findCard(cards, "Power On").value).toBe("02:30:00");
    expect(findCard(cards, "Status").subtitle).toBe("75.50");
  }

  validateTrendFormulaContract(mapped: MappedDtrStatistics): void {
    this.validateLiveOk(mapped);
    const meta = dtrStatisticsContractTrendFormulaMeta;
    const cards = mapped.statisticCards;

    expect(findCard(cards, "Total KW").trendPercent).toBe(
      meta.kw.expectedTrend,
    );
    expect(findCard(cards, "Total KVA").trendPercent).toBe(
      meta.kva.expectedTrend,
    );
    expect(findCard(cards, "Total KWh").trendPercent).toBe(
      meta.kwh.expectedTrend,
    );
    expect(findCard(cards, "Total KVAh").trendPercent).toBe(
      meta.kvah.expectedTrend,
    );

    expect(meta.kw.expectedTrend).toBe(
      calcTrend(meta.kw.current, meta.kw.previous),
    );
    expect(meta.kva.expectedTrend).toBe(
      calcTrend(meta.kva.current, meta.kva.previous),
    );
    expect(meta.kwh.expectedTrend).toBe(
      calcTrend(meta.kwh.current, meta.kwh.previous),
    );
    expect(meta.kvah.expectedTrend).toBe(
      calcTrend(meta.kvah.current, meta.kvah.previous),
    );
  }

  validateStatusLimitedContract(mapped: MappedDtrStatistics): void {
    this.validateLiveOk(mapped);
    const status = findCard(mapped.statisticCards, "Status");
    expect(status.value).toBe("Limited");
    expect(status.subtitle).toBe("150.00");
  }

  validateStatusUnderLoadContract(mapped: MappedDtrStatistics): void {
    this.validateLiveOk(mapped);
    const status = findCard(mapped.statisticCards, "Status");
    expect(status.value).toBe("Under Load");
    expect(status.subtitle).toBe("42.50");
  }

  validateUnbalancedContract(mapped: MappedDtrStatistics): void {
    this.validateLiveOk(mapped);
    expect(findCard(mapped.statisticCards, "Unbalanced LT Feeders").value).toBe(
      "12.5%",
    );
  }

  validatePowerOnContract(mapped: MappedDtrStatistics): void {
    this.validateLiveOk(mapped);
    expect(findCard(mapped.statisticCards, "Power On").value).toBe("03:45:00");
  }

  validateIntegerFeedersContract(mapped: MappedDtrStatistics): void {
    this.validateLiveOk(mapped);
    expect(findCard(mapped.statisticCards, "Total LT Feeders").value).toBe(
      "25",
    );
    expect(findCard(mapped.statisticCards, "LT Feeders Fuse Blown").value).toBe(
      "3",
    );
  }

  /**
   * Widget resilience — unknown DTR may return HTTP 200 with degraded em-dash cards
   * (primary-only path) instead of 404.
   */
  validateGracefulDegradedFallback(mapped: MappedDtrStatistics): void {
    this.validateMappedDegradedFallback(mapped);
  }

  validateScenario(
    mapped: MappedDtrStatistics,
    scenario: DtrStatisticsScenario,
    raw?: DtrStatisticsResponse,
  ): void {
    switch (scenario) {
      case "contract_degraded_em_dash":
        if (raw) this.validateRawDegradedEmDash(raw);
        this.validateMappedDegradedFallback(mapped);
        break;
      case "contract_populated_metrics":
        this.validatePopulatedContract(mapped);
        break;
      case "contract_trend_formula":
        this.validateTrendFormulaContract(mapped);
        break;
      case "contract_status_limited":
        this.validateStatusLimitedContract(mapped);
        break;
      case "contract_status_under_load":
        this.validateStatusUnderLoadContract(mapped);
        break;
      case "contract_unbalanced_percent":
        this.validateUnbalancedContract(mapped);
        break;
      case "contract_power_on_clock":
        this.validatePowerOnContract(mapped);
        break;
      case "contract_integer_feeders_fuse":
        this.validateIntegerFeedersContract(mapped);
        break;
      case "dts_by_code_primary":
      case "dts_by_code_alt":
      case "dts_ignore_unknown_query":
        this.validateLiveOk(mapped);
        break;
      case "dtr_not_found":
        this.validateGracefulDegradedFallback(mapped);
        break;
      default:
        break;
    }
  }
}
