import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { EventLogCardsQuery } from "../Api/eventlogcards.api";
import type { EventLogCardsResponse, EventLogCardsScenario } from "../Mapper/eventlogcards.mapper";
import {
  CONSUMERS_LIVE_IVRS,
  CONSUMERS_LIVE_METER_ROUTE,
  resolveLiveAccountId,
  resolveLiveIvrs,
  resolveLiveMeterRoute,
} from "./consumers-live-refs";
export const eventLogCardsMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;
/** IVRS from live RTP/PQ sample; archive may return all-zero cards. */
export const eventLogCardsDefaultIvrs = CONSUMERS_LIVE_IVRS;
export const eventLogCardsDefaultConsumerId = CONSUMERS_LIVE_IVRS;
export const eventLogCardsDefaultMeterRoute = CONSUMERS_LIVE_METER_ROUTE;
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
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function resolveEventLogCardsRef(scenario: EventLogCardsScenario): string | undefined {
  switch (scenario) {
    case "elc_by_ivrs":
    case "elc_ignore_unknown_query":
      return resolveLiveIvrs(
        process.env.CONSUMER_ELC_IVRS,
        process.env.CONSUMER_LLP_IVRS,
        process.env.CONSUMER_BH_IVRS,
        eventLogCardsDefaultIvrs,
      );
    case "elc_by_account":
      return resolveLiveAccountId(
        process.env.CONSUMER_ELC_CONSUMER_ID,
        process.env.CONSUMER_LLP_CONSUMER_ID,
        process.env.CONSUMER_BH_CONSUMER_ID,
        eventLogCardsDefaultConsumerId,
      );
    case "elc_by_meter":
      return resolveLiveMeterRoute(
        process.env.CONSUMER_ELC_METER_ROUTE,
        process.env.CONSUMER_LLP_METER_ROUTE,
        process.env.CONSUMER_BH_METER_ROUTE,
        process.env.CONSUMER_PROFILE_METER_ROUTE,
        eventLogCardsDefaultMeterRoute,
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

export function resolveEventLogCardsQuery(scenario: EventLogCardsScenario): EventLogCardsQuery {
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
    testName: "Event summary — cards for the consumer",
    scenario: "elc_by_ivrs",
    tags: ["@smoke", "@consumer", "@event-log", "@event-log-cards"],
    nonEmptyExpected: true,
  },
  {
    testName: "Event summary — opens using the account number",
    scenario: "elc_by_account",
    tags: ["@consumer", "@event-log", "@event-log-cards", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event summary — opens using the meter",
    scenario: "elc_by_meter",
    tags: ["@consumer", "@event-log", "@event-log-cards", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event summary — extra unused options are ignored",
    scenario: "elc_ignore_unknown_query",
    tags: ["@consumer", "@event-log", "@event-log-cards", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event summary — sample: all zeros",
    scenario: "contract_empty_cards",
    isContractFixture: true,
    tags: ["@consumer", "@event-log", "@event-log-cards", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event summary — sample: resolved and pending counts",
    scenario: "contract_nonzero_cards",
    isContractFixture: true,
    tags: ["@consumer", "@event-log", "@event-log-cards", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event summary — sample: change vs yesterday is correct",
    scenario: "contract_trend_formula",
    isContractFixture: true,
    tags: ["@consumer", "@event-log", "@event-log-cards", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event summary — sample: long restore time shown as hours and minutes",
    scenario: "contract_avg_display",
    isContractFixture: true,
    tags: ["@consumer", "@event-log", "@event-log-cards", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event summary — unknown consumer is empty or not found",
    scenario: "consumer_not_found",
    tags: ["@consumer", "@event-log", "@event-log-cards", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event summary — unknown meter is empty or not found",
    scenario: "meter_not_found",
    tags: ["@consumer", "@event-log", "@event-log-cards", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Event summary — blank consumer number is rejected",
    scenario: "empty_consumer_ref",
    expectedStatus: 400,
    tags: ["@consumer", "@event-log", "@event-log-cards", "@negative"],
    nonEmptyExpected: false,
  },
];
