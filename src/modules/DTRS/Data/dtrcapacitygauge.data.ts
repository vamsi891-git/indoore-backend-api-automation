import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrCapacityGaugeQuery } from "../Api/dtrcapacitygauge.api";
import type {
  DtrCapacityGaugeResponse,
  DtrCapacityGaugeScenario,
} from "../Mapper/dtrcapacitygauge.mapper";

export const dtrCapacityGaugeMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** User-provided live DTR code (all-null gauge bands). */
export const dtrCapacityGaugeDefaultCode = "11IW3";

export const dtrCapacityGaugeAltCode = "34SO21";

export const dtrCapacityGaugeNotFoundCode = "INVALID_DTR_XYZ";

export const dtrCapacityGaugeEmptyCode = " ";

export const dtrCapacityGaugeExpectedBands = [
  "Instant",
  "Daily",
  "Monthly",
  "Yearly",
  "LifeTime",
] as const;

export const dtrCapacityGaugeBandUnits = {
  Instant: "KVA",
  Daily: "MDkVA",
  Monthly: "MDkVA",
  Yearly: "MDkVA",
  LifeTime: "MDkVA",
} as const;

const nullBand = (label: (typeof dtrCapacityGaugeExpectedBands)[number]) => ({
  label,
  value: null as number | null,
  percent: null as number | null,
  unit: dtrCapacityGaugeBandUnits[label],
});

/** Live sample for 11IW3 — no IP/billing reads available. */
export const dtrCapacityGaugeContractAllNullResponse: DtrCapacityGaugeResponse = {
  success: true,
  data: {
    ratedCapacityKva: null,
    bands: dtrCapacityGaugeExpectedBands.map((label) => nullBand(label)),
  },
};

/** Populated MD values; rated capacity unavailable → percent stays null. */
export const dtrCapacityGaugeContractPopulatedResponse: DtrCapacityGaugeResponse =
  {
    success: true,
    data: {
      ratedCapacityKva: null,
      bands: [
        { label: "Instant", value: 45.67, percent: null, unit: "KVA" },
        { label: "Daily", value: 52.3, percent: null, unit: "MDkVA" },
        { label: "Monthly", value: 80, percent: null, unit: "MDkVA" },
        { label: "Yearly", value: 95.5, percent: null, unit: "MDkVA" },
        { label: "LifeTime", value: 120.25, percent: null, unit: "MDkVA" },
      ],
    },
  };

/**
 * gaugePercent meta — rated 100 kVA.
 * Instant 45.67 → 46%; Daily 50 → 50%; Monthly 75.5 → 76%.
 */
export const dtrCapacityGaugeContractPercentFormulaMeta = {
  ratedCapacityKva: 100,
  instant: { value: 45.67, expectedPercent: 46 },
  daily: { value: 50, expectedPercent: 50 },
  monthly: { value: 75.5, expectedPercent: 76 },
};

export const dtrCapacityGaugeContractPercentFormulaResponse: DtrCapacityGaugeResponse =
  {
    success: true,
    data: {
      ratedCapacityKva:
        dtrCapacityGaugeContractPercentFormulaMeta.ratedCapacityKva,
      bands: [
        {
          label: "Instant",
          value: dtrCapacityGaugeContractPercentFormulaMeta.instant.value,
          percent:
            dtrCapacityGaugeContractPercentFormulaMeta.instant.expectedPercent,
          unit: "KVA",
        },
        {
          label: "Daily",
          value: dtrCapacityGaugeContractPercentFormulaMeta.daily.value,
          percent:
            dtrCapacityGaugeContractPercentFormulaMeta.daily.expectedPercent,
          unit: "MDkVA",
        },
        {
          label: "Monthly",
          value: dtrCapacityGaugeContractPercentFormulaMeta.monthly.value,
          percent:
            dtrCapacityGaugeContractPercentFormulaMeta.monthly.expectedPercent,
          unit: "MDkVA",
        },
        { label: "Yearly", value: 90, percent: 90, unit: "MDkVA" },
        { label: "LifeTime", value: 100, percent: 100, unit: "MDkVA" },
      ],
    },
  };

/** getDtrCapacityGaugePrimaryByCode — billing skipped; null readings. */
export const dtrCapacityGaugeContractPrimaryFallbackResponse: DtrCapacityGaugeResponse =
  {
    success: true,
    data: {
      ratedCapacityKva: null,
      bands: [
        { label: "Instant", value: 12.5, percent: null, unit: "KVA" },
        { label: "Daily", value: 15, percent: null, unit: "MDkVA" },
        { label: "Monthly", value: null, percent: null, unit: "MDkVA" },
        { label: "Yearly", value: null, percent: null, unit: "MDkVA" },
        { label: "LifeTime", value: null, percent: null, unit: "MDkVA" },
      ],
    },
  };

export interface DtrCapacityGaugeTestCase {
  testName: string;
  scenario: DtrCapacityGaugeScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
}

export function resolveDtrCapacityGaugeCode(
  scenario: DtrCapacityGaugeScenario,
): string | undefined {
  switch (scenario) {
    case "dcg_by_code_primary":
    case "dcg_ignore_unknown_query":
      return (
        process.env.DTR_CAPACITY_GAUGE_CODE?.trim() ||
        process.env.DTR_STATS_CODE?.trim() ||
        dtrCapacityGaugeDefaultCode
      );
    case "dcg_by_code_alt":
      return (
        process.env.DTR_CAPACITY_GAUGE_CODE_ALT?.trim() ||
        process.env.DTR_STATS_CODE_ALT?.trim() ||
        dtrCapacityGaugeAltCode
      );
    case "dtr_not_found":
      return dtrCapacityGaugeNotFoundCode;
    case "empty_dtr_code":
      return dtrCapacityGaugeEmptyCode;
    case "contract_all_null_bands":
    case "contract_populated_bands":
    case "contract_gauge_percent_formula":
    case "contract_primary_fallback_zeros":
      return undefined;
    default:
      return undefined;
  }
}

export function resolveDtrCapacityGaugeQuery(
  scenario: DtrCapacityGaugeScenario,
): DtrCapacityGaugeQuery {
  if (scenario === "dcg_ignore_unknown_query") {
    return { foo: 1, bar: "baz" };
  }
  return {};
}

export function resolveDtrCapacityGaugeContractBody(
  scenario: DtrCapacityGaugeScenario,
): DtrCapacityGaugeResponse | undefined {
  switch (scenario) {
    case "contract_all_null_bands":
      return dtrCapacityGaugeContractAllNullResponse;
    case "contract_populated_bands":
      return dtrCapacityGaugeContractPopulatedResponse;
    case "contract_gauge_percent_formula":
      return dtrCapacityGaugeContractPercentFormulaResponse;
    case "contract_primary_fallback_zeros":
      return dtrCapacityGaugeContractPrimaryFallbackResponse;
    default:
      return undefined;
  }
}

/** @deprecated Use resolveDtrCapacityGaugeCode — kept for backward compatibility. */
export const dtrCapacityGaugeData = {
  dtrCode: dtrCapacityGaugeDefaultCode,
  expectedBands: dtrCapacityGaugeExpectedBands,
  bandUnits: dtrCapacityGaugeBandUnits,
  mdBands: ["Daily", "Monthly", "Yearly", "LifeTime"] as const,
};

export const dtrCapacityGaugeTestCases: DtrCapacityGaugeTestCase[] = [
  {
    testName:
      "Validate GET /indore/dtr/{code}/capacity-gauge — primary DTR (11IW3) gauge bands",
    scenario: "dcg_by_code_primary",
    tags: ["@smoke", "@dtr", "@capacity-gauge"],
  },
  {
    testName:
      "Validate GET /indore/dtr/{code}/capacity-gauge — alternate DTR code",
    scenario: "dcg_by_code_alt",
    tags: ["@dtr", "@capacity-gauge", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/dtr/{code}/capacity-gauge — unknown query params ignored",
    scenario: "dcg_ignore_unknown_query",
    tags: ["@dtr", "@capacity-gauge", "@edge"],
  },
  {
    testName:
      "Contract — all-null bands when IP/billing reads unavailable",
    scenario: "contract_all_null_bands",
    isContractFixture: true,
    tags: ["@dtr", "@capacity-gauge", "@edge"],
  },
  {
    testName:
      "Contract — populated kVA/MDkVA values with null rated capacity (percent null)",
    scenario: "contract_populated_bands",
    isContractFixture: true,
    tags: ["@dtr", "@capacity-gauge", "@edge"],
  },
  {
    testName:
      "Contract — percent matches gaugePercent(value, ratedCapacityKva)",
    scenario: "contract_gauge_percent_formula",
    isContractFixture: true,
    tags: ["@dtr", "@capacity-gauge", "@edge"],
  },
  {
    testName:
      "Contract — primary timeout fallback (instant/daily only, billing null)",
    scenario: "contract_primary_fallback_zeros",
    isContractFixture: true,
    tags: ["@dtr", "@capacity-gauge", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/dtr/{code}/capacity-gauge — DTR not found",
    scenario: "dtr_not_found",
    tags: ["@dtr", "@capacity-gauge", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/dtr/{code}/capacity-gauge — blank DTR code rejected",
    scenario: "empty_dtr_code",
    expectedStatus: 400,
    tags: ["@dtr", "@capacity-gauge", "@negative"],
  },
];
