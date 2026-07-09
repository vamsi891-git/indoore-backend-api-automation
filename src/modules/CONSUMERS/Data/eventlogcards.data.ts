import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { EventLogCardsQuery } from "../Api/eventlogcards.api";
import type {
  EventLogCardsResponse,
  EventLogCardsScenario,
} from "../Mapper/eventlogcards.mapper";

export const eventLogCardsMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** IVRS from user request; live archive may return all-zero cards. */
export const eventLogCardsDefaultIvrs = "N3374018980";

export const eventLogCardsDefaultConsumerId = "N3374018980";

export const eventLogCardsDefaultMeterRoute = "meter-12345";

export const eventLogCardsNotFoundRef = "INVALID_CONSUMER_XYZ";

export const eventLogCardsMeterNotFoundRef = "meter-999999999";

export const eventLogCardsEmptyRef = " ";

/** User-provided live sample — getEmptyEventCards() shape. */
export const eventLogCardsContractEmptyResponse: EventLogCardsResponse = {
  success: true,
  data: {
    resolvedEvents: {
      title: "Resolved Events",
      value: 0,
      trendPercent: 0,
      comparisonLabel: "Yesterday: 0",
    },
    pendingEvents: {
      title: "Pending Events",
      value: 0,
      trendPercent: 0,
      comparisonLabel: "Yesterday: 0",
    },
    avgResolutionTime: {
      title: "Avg Resolution Time",
      valueMinutes: 0,
      valueDisplay: "0m",
      trendPercent: 0,
      comparisonLabel: "Yesterday: 0m",
    },
  },
};

/** Nonzero counts with yesterday comparison labels from buildEventSummaryCards. */
export const eventLogCardsContractNonzeroResponse: EventLogCardsResponse = {
  success: true,
  data: {
    resolvedEvents: {
      title: "Resolved Events",
      value: 5,
      trendPercent: 25,
      comparisonLabel: "Yesterday: 4",
    },
    pendingEvents: {
      title: "Pending Events",
      value: 2,
      trendPercent: -33,
      comparisonLabel: "Yesterday: 3",
    },
    avgResolutionTime: {
      title: "Avg Resolution Time",
      valueMinutes: 45,
      valueDisplay: "45m",
      trendPercent: 50,
      comparisonLabel: "Yesterday: 30m",
    },
  },
};

/**
 * Trend meta for contract_trend_formula — mirrors consumerEventLogTrendPercent.
 * resolved: (10−5)/5×100 = 100; pending: (2−4)/4×100 = −50; avg: (90−30)/30×100 = 200.
 */
export const eventLogCardsContractTrendFormulaMeta = {
  resolved: { current: 10, previous: 5, expectedTrend: 100 },
  pending: { current: 2, previous: 4, expectedTrend: -50 },
  avgMinutes: { current: 90, previous: 30, expectedTrend: 200 },
};

export const eventLogCardsContractTrendFormulaResponse: EventLogCardsResponse = {
  success: true,
  data: {
    resolvedEvents: {
      title: "Resolved Events",
      value: eventLogCardsContractTrendFormulaMeta.resolved.current,
      trendPercent: eventLogCardsContractTrendFormulaMeta.resolved.expectedTrend,
      comparisonLabel: `Yesterday: ${eventLogCardsContractTrendFormulaMeta.resolved.previous}`,
    },
    pendingEvents: {
      title: "Pending Events",
      value: eventLogCardsContractTrendFormulaMeta.pending.current,
      trendPercent: eventLogCardsContractTrendFormulaMeta.pending.expectedTrend,
      comparisonLabel: `Yesterday: ${eventLogCardsContractTrendFormulaMeta.pending.previous}`,
    },
    avgResolutionTime: {
      title: "Avg Resolution Time",
      valueMinutes: eventLogCardsContractTrendFormulaMeta.avgMinutes.current,
      valueDisplay: "1h 30m",
      trendPercent: eventLogCardsContractTrendFormulaMeta.avgMinutes.expectedTrend,
      comparisonLabel: "Yesterday: 30m",
    },
  },
};

/** formatEventLogAvgMinutesDisplay: 125 min → "2h 5m". */
export const eventLogCardsContractAvgDisplayResponse: EventLogCardsResponse = {
  success: true,
  data: {
    resolvedEvents: {
      title: "Resolved Events",
      value: 1,
      trendPercent: 0,
      comparisonLabel: "Yesterday: 0",
    },
    pendingEvents: {
      title: "Pending Events",
      value: 0,
      trendPercent: 0,
      comparisonLabel: "Yesterday: 0",
    },
    avgResolutionTime: {
      title: "Avg Resolution Time",
      valueMinutes: 125,
      valueDisplay: "2h 5m",
      trendPercent: 0,
      comparisonLabel: "Yesterday: 0m",
    },
  },
};

export interface EventLogCardsTestCase {
  testName: string;
  scenario: EventLogCardsScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
}

export function resolveEventLogCardsRef(
  scenario: EventLogCardsScenario,
): string | undefined {
  switch (scenario) {
    case "elc_by_ivrs":
    case "elc_ignore_unknown_query":
      return (
        process.env.CONSUMER_ELC_IVRS?.trim() ||
        process.env.CONSUMER_LLP_IVRS?.trim() ||
        process.env.CONSUMER_BH_IVRS?.trim() ||
        eventLogCardsDefaultIvrs
      );
    case "elc_by_account":
      return (
        process.env.CONSUMER_ELC_CONSUMER_ID?.trim() ||
        process.env.CONSUMER_LLP_CONSUMER_ID?.trim() ||
        process.env.CONSUMER_BH_CONSUMER_ID?.trim() ||
        eventLogCardsDefaultConsumerId
      );
    case "elc_by_meter":
      return (
        process.env.CONSUMER_ELC_METER_ROUTE?.trim() ||
        process.env.CONSUMER_LLP_METER_ROUTE?.trim() ||
        process.env.CONSUMER_BH_METER_ROUTE?.trim() ||
        process.env.CONSUMER_PROFILE_METER_ROUTE?.trim() ||
        eventLogCardsDefaultMeterRoute
      );
    case "consumer_not_found":
      return eventLogCardsNotFoundRef;
    case "meter_not_found":
      return eventLogCardsMeterNotFoundRef;
    case "empty_consumer_ref":
      return eventLogCardsEmptyRef;
    case "contract_empty_cards":
    case "contract_nonzero_cards":
    case "contract_trend_formula":
    case "contract_avg_display":
      return undefined;
    default:
      return undefined;
  }
}

export function resolveEventLogCardsQuery(
  scenario: EventLogCardsScenario,
): EventLogCardsQuery {
  if (scenario === "elc_ignore_unknown_query") {
    return { foo: 1 };
  }
  return {};
}

export function resolveEventLogCardsContractBody(
  scenario: EventLogCardsScenario,
): EventLogCardsResponse | undefined {
  switch (scenario) {
    case "contract_empty_cards":
      return eventLogCardsContractEmptyResponse;
    case "contract_nonzero_cards":
      return eventLogCardsContractNonzeroResponse;
    case "contract_trend_formula":
      return eventLogCardsContractTrendFormulaResponse;
    case "contract_avg_display":
      return eventLogCardsContractAvgDisplayResponse;
    default:
      return undefined;
  }
}

export const eventLogCardsTestCases: EventLogCardsTestCase[] = [
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/event-log/cards — success with summary cards",
    scenario: "elc_by_ivrs",
    tags: ["@smoke", "@consumer", "@event-log", "@event-log-cards"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/event-log/cards — resolve by account id",
    scenario: "elc_by_account",
    tags: ["@consumer", "@event-log", "@event-log-cards", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/event-log/cards — resolve by meter lookup id",
    scenario: "elc_by_meter",
    tags: ["@consumer", "@event-log", "@event-log-cards", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/event-log/cards — unknown query params ignored",
    scenario: "elc_ignore_unknown_query",
    tags: ["@consumer", "@event-log", "@event-log-cards", "@edge"],
  },
  {
    testName:
      "Contract — empty cards (getEmptyEventCards backend fallback)",
    scenario: "contract_empty_cards",
    isContractFixture: true,
    tags: ["@consumer", "@event-log", "@event-log-cards", "@edge"],
  },
  {
    testName:
      "Contract — nonzero resolved/pending counts with trend and comparison labels",
    scenario: "contract_nonzero_cards",
    isContractFixture: true,
    tags: ["@consumer", "@event-log", "@event-log-cards", "@edge"],
  },
  {
    testName:
      "Contract — trendPercent matches ((current − previous) / previous) × 100",
    scenario: "contract_trend_formula",
    isContractFixture: true,
    tags: ["@consumer", "@event-log", "@event-log-cards", "@edge"],
  },
  {
    testName:
      "Contract — avg valueDisplay uses hours+minutes when valueMinutes ≥ 60",
    scenario: "contract_avg_display",
    isContractFixture: true,
    tags: ["@consumer", "@event-log", "@event-log-cards", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/event-log/cards — consumer not found or empty cards",
    scenario: "consumer_not_found",
    tags: ["@consumer", "@event-log", "@event-log-cards", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/event-log/cards — unknown meter not found or empty cards",
    scenario: "meter_not_found",
    tags: ["@consumer", "@event-log", "@event-log-cards", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ref}/event-log/cards — blank consumer ref rejected",
    scenario: "empty_consumer_ref",
    expectedStatus: 400,
    tags: ["@consumer", "@event-log", "@event-log-cards", "@negative"],
  },
];
