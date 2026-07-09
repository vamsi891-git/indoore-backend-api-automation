import { expect } from "@playwright/test";
import {
  eventLogCardsContractTrendFormulaMeta,
} from "../Data/eventlogcards.data";
import type {
  EventLogAvgResolutionCard,
  EventLogCardsData,
  EventLogCardsErrorResponse,
  EventLogCardsScenario,
  EventLogCountCard,
  MappedEventLogCards,
} from "../Mapper/eventlogcards.mapper";

/** Mirrors backend consumerEventLogTrendPercent. */
function consumerEventLogTrendPercent(
  current: number,
  previous: number,
): number {
  if (previous === 0) {
    return 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

/** Mirrors backend formatEventLogAvgMinutesDisplay. */
function formatEventLogAvgMinutesDisplay(avgMin: number): string {
  return avgMin >= 60
    ? `${Math.floor(avgMin / 60)}h ${avgMin % 60}m`
    : `${avgMin}m`;
}

function parseYesterdayCount(label: string): number | null {
  const match = /^Yesterday:\s*(\d+)$/.exec(label.trim());
  return match ? Number(match[1]) : null;
}

function parseYesterdayAvgDisplay(label: string): string | null {
  const match = /^Yesterday:\s*(.+)$/.exec(label.trim());
  return match ? match[1]!.trim() : null;
}

export class EventLogCardsValidator {
  validateSuccess(success: boolean) {
    expect(success).toBeTruthy();
  }

  validateNotFoundError(responseBody: EventLogCardsErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("CONSUMER_NOT_FOUND");
    expect(responseBody.error.message.toLowerCase()).toContain(
      "consumer not found",
    );
  }

  validateBlankRefError(responseBody: EventLogCardsErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toContain("ivrsno");
    const fieldErrors = responseBody.error.details?.fieldErrors?.ivrsNo;
    expect(Array.isArray(fieldErrors) && fieldErrors.length > 0).toBeTruthy();
  }

  validateCountCard(card: EventLogCountCard, expectedTitle: string) {
    expect(card.title).toBe(expectedTitle);
    expect(typeof card.value).toBe("number");
    expect(card.value).toBeGreaterThanOrEqual(0);
    expect(typeof card.trendPercent).toBe("number");
    expect(typeof card.comparisonLabel).toBe("string");
    expect(card.comparisonLabel.startsWith("Yesterday: ")).toBeTruthy();
    expect(card.trendPercent).toBeGreaterThanOrEqual(-100);

    const yesterday = parseYesterdayCount(card.comparisonLabel);
    expect(yesterday).not.toBeNull();
    if (yesterday != null) {
      expect(card.trendPercent).toBe(
        consumerEventLogTrendPercent(card.value, yesterday),
      );
    }
  }

  validateAvgResolutionCard(card: EventLogAvgResolutionCard) {
    expect(card.title).toBe("Avg Resolution Time");
    expect(typeof card.valueMinutes).toBe("number");
    expect(card.valueMinutes).toBeGreaterThanOrEqual(0);
    expect(typeof card.valueDisplay).toBe("string");
    expect(card.valueDisplay).toContain("m");
    expect(card.valueDisplay).toBe(
      formatEventLogAvgMinutesDisplay(card.valueMinutes),
    );
    expect(typeof card.trendPercent).toBe("number");
    expect(card.comparisonLabel.startsWith("Yesterday: ")).toBeTruthy();
    expect(card.trendPercent).toBeGreaterThanOrEqual(-100);

    const yesterdayDisplay = parseYesterdayAvgDisplay(card.comparisonLabel);
    expect(yesterdayDisplay).not.toBeNull();
    if (yesterdayDisplay != null) {
      const yesterdayMinutes = yesterdayDisplay.endsWith("m")
        ? this.parseAvgMinutesFromDisplay(yesterdayDisplay)
        : null;
      if (yesterdayMinutes != null) {
        expect(card.trendPercent).toBe(
          consumerEventLogTrendPercent(card.valueMinutes, yesterdayMinutes),
        );
      }
    }
  }

  private parseAvgMinutesFromDisplay(display: string): number | null {
    const trimmed = display.trim();
    const hourMatch = /^(\d+)h\s*(\d+)m$/.exec(trimmed);
    if (hourMatch) {
      return Number(hourMatch[1]) * 60 + Number(hourMatch[2]);
    }
    const minMatch = /^(\d+)m$/.exec(trimmed);
    if (minMatch) {
      return Number(minMatch[1]);
    }
    return null;
  }

  validateCardStructure(data: EventLogCardsData) {
    this.validateCountCard(data.resolvedEvents, "Resolved Events");
    this.validateCountCard(data.pendingEvents, "Pending Events");
    this.validateAvgResolutionCard(data.avgResolutionTime);
    expect(data.resolvedEvents.title).not.toEqual(data.pendingEvents.title);
  }

  validateLiveOk(mapped: MappedEventLogCards) {
    this.validateSuccess(mapped.success);
    expect(mapped.data).not.toBeNull();
    this.validateCardStructure(mapped.data as EventLogCardsData);
  }

  /**
   * Widget resilience — unknown routes may return HTTP 200 with
   * getEmptyEventCards (all zeros, Yesterday: 0 / 0m).
   */
  validateGracefulEmptyFallback(mapped: MappedEventLogCards) {
    this.validateLiveOk(mapped);
    const data = mapped.data as EventLogCardsData;
    expect(data.resolvedEvents.value).toBe(0);
    expect(data.pendingEvents.value).toBe(0);
    expect(data.avgResolutionTime.valueMinutes).toBe(0);
    expect(data.avgResolutionTime.valueDisplay).toBe("0m");
    expect(data.resolvedEvents.comparisonLabel).toBe("Yesterday: 0");
    expect(data.pendingEvents.comparisonLabel).toBe("Yesterday: 0");
    expect(data.avgResolutionTime.comparisonLabel).toBe("Yesterday: 0m");
    expect(data.resolvedEvents.trendPercent).toBe(0);
    expect(data.pendingEvents.trendPercent).toBe(0);
    expect(data.avgResolutionTime.trendPercent).toBe(0);
  }

  validateEmptyContract(mapped: MappedEventLogCards) {
    this.validateGracefulEmptyFallback(mapped);
  }

  validateNonzeroContract(mapped: MappedEventLogCards) {
    this.validateLiveOk(mapped);
    const data = mapped.data as EventLogCardsData;
    expect(data.resolvedEvents.value).toBe(5);
    expect(data.pendingEvents.value).toBe(2);
    expect(data.avgResolutionTime.valueMinutes).toBe(45);
    expect(data.avgResolutionTime.valueDisplay).toBe("45m");
    expect(data.resolvedEvents.comparisonLabel).toBe("Yesterday: 4");
    expect(data.pendingEvents.comparisonLabel).toBe("Yesterday: 3");
    expect(data.avgResolutionTime.comparisonLabel).toBe("Yesterday: 30m");
  }

  validateTrendFormulaContract(mapped: MappedEventLogCards) {
    this.validateLiveOk(mapped);
    const data = mapped.data as EventLogCardsData;
    const meta = eventLogCardsContractTrendFormulaMeta;

    expect(data.resolvedEvents.value).toBe(meta.resolved.current);
    expect(data.resolvedEvents.trendPercent).toBe(meta.resolved.expectedTrend);
    expect(data.pendingEvents.value).toBe(meta.pending.current);
    expect(data.pendingEvents.trendPercent).toBe(meta.pending.expectedTrend);
    expect(data.avgResolutionTime.valueMinutes).toBe(meta.avgMinutes.current);
    expect(data.avgResolutionTime.trendPercent).toBe(
      meta.avgMinutes.expectedTrend,
    );

    expect(data.resolvedEvents.trendPercent).toBe(
      consumerEventLogTrendPercent(
        meta.resolved.current,
        meta.resolved.previous,
      ),
    );
    expect(data.pendingEvents.trendPercent).toBe(
      consumerEventLogTrendPercent(meta.pending.current, meta.pending.previous),
    );
    expect(data.avgResolutionTime.trendPercent).toBe(
      consumerEventLogTrendPercent(
        meta.avgMinutes.current,
        meta.avgMinutes.previous,
      ),
    );
  }

  validateAvgDisplayContract(mapped: MappedEventLogCards) {
    this.validateLiveOk(mapped);
    const avg = (mapped.data as EventLogCardsData).avgResolutionTime;
    expect(avg.valueMinutes).toBe(125);
    expect(avg.valueDisplay).toBe("2h 5m");
    expect(avg.valueDisplay).toBe(
      formatEventLogAvgMinutesDisplay(avg.valueMinutes),
    );
  }

  validateScenario(mapped: MappedEventLogCards, scenario: EventLogCardsScenario) {
    switch (scenario) {
      case "contract_empty_cards":
        this.validateEmptyContract(mapped);
        break;
      case "contract_nonzero_cards":
        this.validateNonzeroContract(mapped);
        break;
      case "contract_trend_formula":
        this.validateTrendFormulaContract(mapped);
        break;
      case "contract_avg_display":
        this.validateAvgDisplayContract(mapped);
        break;
      case "elc_by_ivrs":
      case "elc_by_account":
      case "elc_by_meter":
      case "elc_ignore_unknown_query":
        this.validateLiveOk(mapped);
        break;
      case "meter_not_found":
      case "consumer_not_found":
        this.validateGracefulEmptyFallback(mapped);
        break;
      default:
        break;
    }
  }
}
