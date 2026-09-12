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
  "Total Consumer",
  "Total KW",
  "Total KVA",
  "Total KWh",
  "Total KVAh",
  "Power On",
  "Power Off",
  "Status",
] as const;

export const dtrStatisticsExpectedSubtitles = {
  "Total Consumer": "Linked to this DTR",
  "Total KW": "Active Power",
  "Total KVA": "Apparent Power",
  "Total KWh": "Cumulative Active Energy",
  "Total KVAh": "Cumulative Apparent Energy",
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
        title: "Total Consumer",
        value: "0",
        subtitle: "Linked to this DTR",
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
        title: "Total Consumer",
        value: "12",
        subtitle: "Linked to this DTR",
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
          title: "Total Consumer",
          value: "5",
          subtitle: "Linked to this DTR",
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
        card.title === "Total Consumer"
          ? { ...card, value: "42" }
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
          if (card.title === "Total Consumer") {
            return { ...card, value: "25" };
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
    testName: "DTR statistic cards — load, energy, consumers, and status",
    scenario: "dts_by_code_primary",
    tags: ["@smoke", "@dtr", "@statistics"],
  },
  {
    testName: "DTR statistic cards — a second transformer still shows cards",
    scenario: "dts_by_code_alt",
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName:
      "DTR statistic cards — extra filters that nobody uses are ignored",
    scenario: "dts_ignore_unknown_query",
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName: "Sample statistic cards — dashes when numbers are missing",
    scenario: "contract_degraded_em_dash",
    isContractFixture: true,
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName:
      "Sample statistic cards — kW, kVA, kWh, kVAh, consumers, and power-on time",
    scenario: "contract_populated_metrics",
    isContractFixture: true,
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName: "Sample statistic cards — up/down percent vs last period",
    scenario: "contract_trend_formula",
    isContractFixture: true,
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName: "Sample statistic cards — status shows Limited when load is capped",
    scenario: "contract_status_limited",
    isContractFixture: true,
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName: "Sample statistic cards — status shows Under Load",
    scenario: "contract_status_under_load",
    isContractFixture: true,
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName: "Sample statistic cards — consumer count is zero or more",
    scenario: "contract_unbalanced_percent",
    isContractFixture: true,
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName: "Sample statistic cards — power-on time looks like a clock",
    scenario: "contract_power_on_clock",
    isContractFixture: true,
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName: "Sample statistic cards — feeder and fuse counts are whole numbers",
    scenario: "contract_integer_feeders_fuse",
    isContractFixture: true,
    tags: ["@dtr", "@statistics", "@edge"],
  },
  {
    testName:
      "DTR statistic cards — unknown transformer is not shown or cards are empty",
    scenario: "dtr_not_found",
    tags: ["@dtr", "@statistics", "@negative"],
  },
  {
    testName: "DTR statistic cards — a blank transformer code is not allowed",
    scenario: "empty_dtr_code",
    expectedStatus: 400,
    tags: ["@dtr", "@statistics", "@negative"],
  },
];
