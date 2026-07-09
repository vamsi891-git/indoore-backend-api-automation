import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrStatisticsQuery } from "../Api/dtrstatistics.api";
import type {
  DtrStatisticsResponse,
  DtrStatisticsScenario,
} from "../Mapper/dtrstatistics.mapper";
import { EM_DASH } from "../utils/dtr-backend.util";

export const dtrStatisticsMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** User-provided live DTR code (degraded em-dash cards). */
export const dtrStatisticsDefaultCode = "10IW1";

export const dtrStatisticsAltCode = "34SO21";

export const dtrStatisticsNotFoundCode = "INVALID_DTR_XYZ";

export const dtrStatisticsEmptyCode = " ";

export const dtrStatisticsExpectedCardTitles = [
  "Total LT Feeders",
  "Total KW",
  "Total KVA",
  "Total KWh",
  "Total KVAh",
  "LT Feeders Fuse Blown",
  "Unbalanced LT Feeders",
  "Power On",
  "Power Off",
  "Status",
] as const;

export const dtrStatisticsExpectedSubtitles = {
  "Total LT Feeders": "Connected to DTR",
  "Total KW": "Active Power",
  "Total KVA": "Apparent Power",
  "Total KWh": "Cumulative Active Energy",
  "Total KVAh": "Cumulative Apparent Energy",
  "LT Feeders Fuse Blown": "Requires maintenance",
  "Unbalanced LT Feeders": "Last Month",
  "Power On": null,
  "Power Off": null,
} as const;

export const dtrStatisticsCardsWithTrend = [
  "Total KW",
  "Total KVA",
  "Total KWh",
  "Total KVAh",
] as const;

export const dtrStatisticsStatusValues = ["Limited", "Under Load"] as const;

/** Live sample for 10IW1 — archive/telemetry unavailable (em-dash placeholders). */
export const dtrStatisticsContractDegradedResponse: DtrStatisticsResponse = {
  success: true,
  data: {
    statisticCards: [
      {
        title: "Total LT Feeders",
        value: "0",
        subtitle: "Connected to DTR",
        trendPercent: null,
      },
      {
        title: "Total KW",
        value: EM_DASH,
        subtitle: "Active Power",
        trendPercent: null,
      },
      {
        title: "Total KVA",
        value: EM_DASH,
        subtitle: "Apparent Power",
        trendPercent: null,
      },
      {
        title: "Total KWh",
        value: EM_DASH,
        subtitle: "Cumulative Active Energy",
        trendPercent: null,
      },
      {
        title: "Total KVAh",
        value: EM_DASH,
        subtitle: "Cumulative Apparent Energy",
        trendPercent: null,
      },
      {
        title: "LT Feeders Fuse Blown",
        value: "0",
        subtitle: "Requires maintenance",
        trendPercent: null,
      },
      {
        title: "Unbalanced LT Feeders",
        value: EM_DASH,
        subtitle: "Last Month",
        trendPercent: null,
      },
      {
        title: "Power On",
        value: EM_DASH,
        subtitle: null,
        trendPercent: null,
      },
      {
        title: "Power Off",
        value: EM_DASH,
        subtitle: null,
        trendPercent: null,
      },
      {
        title: "Status",
        value: "Under Load",
        subtitle: EM_DASH,
        trendPercent: null,
      },
    ],
  },
};

/** Populated instantaneous/cumulative metrics without trends. */
export const dtrStatisticsContractPopulatedResponse: DtrStatisticsResponse = {
  success: true,
  data: {
    statisticCards: [
      {
        title: "Total LT Feeders",
        value: "12",
        subtitle: "Connected to DTR",
        trendPercent: null,
      },
      {
        title: "Total KW",
        value: "45.67",
        subtitle: "Active Power",
        trendPercent: null,
      },
      {
        title: "Total KVA",
        value: "50",
        subtitle: "Apparent Power",
        trendPercent: null,
      },
      {
        title: "Total KWh",
        value: "12345.78",
        subtitle: "Cumulative Active Energy",
        trendPercent: null,
      },
      {
        title: "Total KVAh",
        value: "13000.12",
        subtitle: "Cumulative Apparent Energy",
        trendPercent: null,
      },
      {
        title: "LT Feeders Fuse Blown",
        value: "2",
        subtitle: "Requires maintenance",
        trendPercent: null,
      },
      {
        title: "Unbalanced LT Feeders",
        value: "8.5%",
        subtitle: "Last Month",
        trendPercent: null,
      },
      {
        title: "Power On",
        value: "02:30:00",
        subtitle: null,
        trendPercent: null,
      },
      {
        title: "Power Off",
        value: EM_DASH,
        subtitle: null,
        trendPercent: null,
      },
      {
        title: "Status",
        value: "Under Load",
        subtitle: "75.50",
        trendPercent: null,
      },
    ],
  },
};

/**
 * Trend meta for contract_trend_formula — mirrors backend calcTrend.
 * KW: (110−100)/100×100 = 10; KVA: (55−50)/50×100 = 10;
 * KWh: (1000−800)/800×100 = 25; KVAh: (1200−1000)/1000×100 = 20.
 */
export const dtrStatisticsContractTrendFormulaMeta = {
  kw: { current: 110, previous: 100, expectedTrend: 10 },
  kva: { current: 55, previous: 50, expectedTrend: 10 },
  kwh: { current: 1000, previous: 800, expectedTrend: 25 },
  kvah: { current: 1200, previous: 1000, expectedTrend: 20 },
};

export const dtrStatisticsContractTrendFormulaResponse: DtrStatisticsResponse =
  {
    success: true,
    data: {
      statisticCards: [
        {
          title: "Total LT Feeders",
          value: "5",
          subtitle: "Connected to DTR",
          trendPercent: null,
        },
        {
          title: "Total KW",
          value: "110.00",
          subtitle: "Active Power",
          trendPercent:
            dtrStatisticsContractTrendFormulaMeta.kw.expectedTrend,
        },
        {
          title: "Total KVA",
          value: "55",
          subtitle: "Apparent Power",
          trendPercent:
            dtrStatisticsContractTrendFormulaMeta.kva.expectedTrend,
        },
        {
          title: "Total KWh",
          value: "1000.00",
          subtitle: "Cumulative Active Energy",
          trendPercent:
            dtrStatisticsContractTrendFormulaMeta.kwh.expectedTrend,
        },
        {
          title: "Total KVAh",
          value: "1200.00",
          subtitle: "Cumulative Apparent Energy",
          trendPercent:
            dtrStatisticsContractTrendFormulaMeta.kvah.expectedTrend,
        },
        {
          title: "LT Feeders Fuse Blown",
          value: "0",
          subtitle: "Requires maintenance",
          trendPercent: null,
        },
        {
          title: "Unbalanced LT Feeders",
          value: "0%",
          subtitle: "Last Month",
          trendPercent: null,
        },
        {
          title: "Power On",
          value: "01:00:00",
          subtitle: null,
          trendPercent: null,
        },
        {
          title: "Power Off",
          value: EM_DASH,
          subtitle: null,
          trendPercent: null,
        },
        {
          title: "Status",
          value: "Under Load",
          subtitle: "100.00",
          trendPercent: null,
        },
      ],
    },
  };

export const dtrStatisticsContractStatusLimitedResponse: DtrStatisticsResponse =
  {
    success: true,
    data: {
      statisticCards: dtrStatisticsContractDegradedResponse.data!
        .statisticCards.map((card) =>
          card.title === "Status"
            ? {
                ...card,
                value: "Limited",
                subtitle: "150.00",
              }
            : card,
        ),
    },
  };

export const dtrStatisticsContractStatusUnderLoadResponse: DtrStatisticsResponse =
  {
    success: true,
    data: {
      statisticCards: dtrStatisticsContractDegradedResponse.data!
        .statisticCards.map((card) =>
          card.title === "Status"
            ? {
                ...card,
                value: "Under Load",
                subtitle: "42.50",
              }
            : card,
        ),
    },
  };

export const dtrStatisticsContractUnbalancedResponse: DtrStatisticsResponse = {
  success: true,
  data: {
    statisticCards: dtrStatisticsContractDegradedResponse.data!.statisticCards.map(
      (card) =>
        card.title === "Unbalanced LT Feeders"
          ? { ...card, value: "12.5%" }
          : card,
    ),
  },
};

export const dtrStatisticsContractPowerOnResponse: DtrStatisticsResponse = {
  success: true,
  data: {
    statisticCards: dtrStatisticsContractDegradedResponse.data!.statisticCards.map(
      (card) =>
        card.title === "Power On" ? { ...card, value: "03:45:00" } : card,
    ),
  },
};

export const dtrStatisticsContractIntegerFeedersResponse: DtrStatisticsResponse =
  {
    success: true,
    data: {
      statisticCards: dtrStatisticsContractDegradedResponse.data!.statisticCards.map(
        (card) => {
          if (card.title === "Total LT Feeders") {
            return { ...card, value: "25" };
          }
          if (card.title === "LT Feeders Fuse Blown") {
            return { ...card, value: "3" };
          }
          return card;
        },
      ),
    },
  };

export interface DtrStatisticsTestCase {
  testName: string;
  scenario: DtrStatisticsScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
}

export function resolveDtrStatisticsCode(
  scenario: DtrStatisticsScenario,
): string | undefined {
  switch (scenario) {
    case "dts_by_code_primary":
    case "dts_ignore_unknown_query":
      return (
        process.env.DTR_STATS_CODE?.trim() ||
        process.env.DTR_PROFILE_CODE?.trim() ||
        dtrStatisticsDefaultCode
      );
    case "dts_by_code_alt":
      return (
        process.env.DTR_STATS_CODE_ALT?.trim() ||
        process.env.DTR_FEEDERS_CODE?.trim() ||
        dtrStatisticsAltCode
      );
    case "dtr_not_found":
      return dtrStatisticsNotFoundCode;
    case "empty_dtr_code":
      return dtrStatisticsEmptyCode;
    case "contract_degraded_em_dash":
    case "contract_populated_metrics":
    case "contract_trend_formula":
    case "contract_status_limited":
    case "contract_status_under_load":
    case "contract_unbalanced_percent":
    case "contract_power_on_clock":
    case "contract_integer_feeders_fuse":
      return undefined;
    default:
      return undefined;
  }
}

export function resolveDtrStatisticsQuery(
  scenario: DtrStatisticsScenario,
): DtrStatisticsQuery {
  if (scenario === "dts_ignore_unknown_query") {
    return { foo: 1, bar: "baz" };
  }
  return {};
}

export function resolveDtrStatisticsContractBody(
  scenario: DtrStatisticsScenario,
): DtrStatisticsResponse | undefined {
  switch (scenario) {
    case "contract_degraded_em_dash":
      return dtrStatisticsContractDegradedResponse;
    case "contract_populated_metrics":
      return dtrStatisticsContractPopulatedResponse;
    case "contract_trend_formula":
      return dtrStatisticsContractTrendFormulaResponse;
    case "contract_status_limited":
      return dtrStatisticsContractStatusLimitedResponse;
    case "contract_status_under_load":
      return dtrStatisticsContractStatusUnderLoadResponse;
    case "contract_unbalanced_percent":
      return dtrStatisticsContractUnbalancedResponse;
    case "contract_power_on_clock":
      return dtrStatisticsContractPowerOnResponse;
    case "contract_integer_feeders_fuse":
      return dtrStatisticsContractIntegerFeedersResponse;
    default:
      return undefined;
  }
}

/** @deprecated Use resolveDtrStatisticsCode — kept for backward compatibility. */
export const dtrStatisticsData = {
  dtrCode: dtrStatisticsDefaultCode,
  expectedCardTitles: dtrStatisticsExpectedCardTitles,
  expectedSubtitles: dtrStatisticsExpectedSubtitles,
  cardsWithTrend: dtrStatisticsCardsWithTrend,
  statusValues: dtrStatisticsStatusValues,
};

export const dtrStatisticsTestCases: DtrStatisticsTestCase[] = [
  {
    testName:
      "Validate GET /indore/dtr/{code}/statistics — primary DTR (10IW1) statistic cards",
    scenario: "dts_by_code_primary",
    tags: ["@smoke", "@dtr", "@statistics"],
  },
  {
    testName:
      "Validate GET /indore/dtr/{code}/statistics — alternate DTR code",
    scenario: "dts_by_code_alt",
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/dtr/{code}/statistics — unknown query params ignored",
    scenario: "dts_ignore_unknown_query",
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName:
      "Contract — degraded em-dash cards (buildStatisticCards unavailable metrics)",
    scenario: "contract_degraded_em_dash",
    isContractFixture: true,
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName:
      "Contract — populated KW/KVA/KWh/KVAh with feeder counts and power-on clock",
    scenario: "contract_populated_metrics",
    isContractFixture: true,
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName:
      "Contract — trendPercent matches ((current − previous) / previous) × 100",
    scenario: "contract_trend_formula",
    isContractFixture: true,
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName:
      "Contract — Status card shows Limited when load limit function active",
    scenario: "contract_status_limited",
    isContractFixture: true,
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName:
      "Contract — Status card shows Under Load with numeric load-limit subtitle",
    scenario: "contract_status_under_load",
    isContractFixture: true,
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName:
      "Contract — Unbalanced LT Feeders displays percent (calculateUnbalance)",
    scenario: "contract_unbalanced_percent",
    isContractFixture: true,
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName:
      "Contract — Power On uses HH:MM:SS clock from cumulative minutes",
    scenario: "contract_power_on_clock",
    isContractFixture: true,
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName:
      "Contract — Total LT Feeders and Fuse Blown are non-negative integers",
    scenario: "contract_integer_feeders_fuse",
    isContractFixture: true,
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/dtr/{code}/statistics — DTR not found or degraded cards",
    scenario: "dtr_not_found",
    tags: ["@dtr", "@statistics", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/dtr/{code}/statistics — blank DTR code rejected",
    scenario: "empty_dtr_code",
    expectedStatus: 400,
    tags: ["@dtr", "@statistics", "@negative"],
  },
];
