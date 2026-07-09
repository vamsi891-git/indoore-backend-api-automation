import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { BillingHistoryQuery } from "../Api/billinghistory.api";
import type {
  BillingHistoryResponse,
  BillingHistoryRow,
  BillingHistoryScenario,
} from "../Mapper/billinghistory.mapper";

export const billingHistoryMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** Mirrors backend CONSUMER_BILLING_HISTORY_DEFAULT_SPAN_MONTHS. */
export const BILLING_HISTORY_DEFAULT_SPAN_MONTHS = 24;

/** IVRS from user request; live archive may return all-empty month rows. */
export const billingHistoryDefaultIvrs = "N3374018980";

export const billingHistoryDefaultConsumerId = "N3374018980";

export const billingHistoryDefaultMeterRoute = "meter-12345";

export const billingHistoryNotFoundRef = "INVALID_CONSUMER_XYZ";

export const billingHistoryMeterNotFoundRef = "meter-999999999";

export const billingHistoryEmptyRef = " ";

const EM_DASH = "—";

function emptyBillingMonthRow(periodLabel: string): BillingHistoryRow {
  return {
    periodLabel,
    consumptionKwh: null,
    billAmount: null,
    consumptionSummaryText: EM_DASH,
    paymentStatus: null,
  };
}

/** User-provided billingLimit=0 sample (24 IST months, newest first). */
const CONTRACT_EMPTY_24_LABELS = [
  "July 2026",
  "June 2026",
  "May 2026",
  "April 2026",
  "March 2026",
  "February 2026",
  "January 2026",
  "December 2025",
  "November 2025",
  "October 2025",
  "September 2025",
  "August 2025",
  "July 2025",
  "June 2025",
  "May 2025",
  "April 2025",
  "March 2025",
  "February 2025",
  "January 2025",
  "December 2024",
  "November 2024",
  "October 2024",
  "September 2024",
  "August 2024",
] as const;

const CONTRACT_EMPTY_12_LABELS = CONTRACT_EMPTY_24_LABELS.slice(0, 12);

export const billingHistoryContractEmpty24Response: BillingHistoryResponse = {
  success: true,
  data: CONTRACT_EMPTY_24_LABELS.map((periodLabel) =>
    emptyBillingMonthRow(periodLabel),
  ),
};

export const billingHistoryContractEmpty12Response: BillingHistoryResponse = {
  success: true,
  data: CONTRACT_EMPTY_12_LABELS.map((periodLabel) =>
    emptyBillingMonthRow(periodLabel),
  ),
};

/**
 * Archive cumulative registers (raw ÷ 1000 = kWh):
 * Jan 100 → period 0 (no previous); Feb 250 → period 150; Mar 250 → period 0.
 * API order: newest first.
 */
export const billingHistoryContractNonzeroResponse: BillingHistoryResponse = {
  success: true,
  data: [
    {
      periodLabel: "March 2026",
      consumptionKwh: 0,
      billAmount: null,
      consumptionSummaryText: "0 KWH Consumed",
      paymentStatus: null,
    },
    {
      periodLabel: "February 2026",
      consumptionKwh: 150,
      billAmount: null,
      consumptionSummaryText: "150 KWH Consumed",
      paymentStatus: null,
    },
    {
      periodLabel: "January 2026",
      consumptionKwh: 0,
      billAmount: null,
      consumptionSummaryText: "0 KWH Consumed",
      paymentStatus: null,
    },
  ],
};

export const billingHistoryContractConsumptionFormulaMeta = {
  archiveRows: [
    { monthKey: "2026-01", importKwhRaw: 100_000 },
    { monthKey: "2026-02", importKwhRaw: 250_000 },
    { monthKey: "2026-03", importKwhRaw: 250_000 },
  ],
  expectedPeriodKwh: [0, 150, 0],
} as const;

export const billingHistoryContractConsumptionFormulaResponse: BillingHistoryResponse =
  billingHistoryContractNonzeroResponse;

export interface BillingHistoryTestCase {
  testName: string;
  scenario: BillingHistoryScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
}

export function resolveBillingHistoryRef(
  scenario: BillingHistoryScenario,
): string | undefined {
  switch (scenario) {
    case "bh_by_ivrs_all":
    case "bh_limit_12":
    case "bh_limit_6":
    case "bh_ignore_unknown_query":
    case "invalid_billing_limit":
      return (
        process.env.CONSUMER_BH_IVRS?.trim() ||
        process.env.CONSUMER_EF_IVRS?.trim() ||
        process.env.CONSUMER_ECG_IVRS?.trim() ||
        billingHistoryDefaultIvrs
      );
    case "bh_by_account":
      return (
        process.env.CONSUMER_BH_CONSUMER_ID?.trim() ||
        process.env.CONSUMER_EF_CONSUMER_ID?.trim() ||
        process.env.CONSUMER_ECG_CONSUMER_ID?.trim() ||
        billingHistoryDefaultConsumerId
      );
    case "bh_by_meter":
      return (
        process.env.CONSUMER_BH_METER_ROUTE?.trim() ||
        process.env.CONSUMER_EF_METER_ROUTE?.trim() ||
        process.env.CONSUMER_ECG_METER_ROUTE?.trim() ||
        process.env.CONSUMER_PROFILE_METER_ROUTE?.trim() ||
        billingHistoryDefaultMeterRoute
      );
    case "consumer_not_found":
      return billingHistoryNotFoundRef;
    case "meter_not_found":
      return billingHistoryMeterNotFoundRef;
    case "empty_consumer_ref":
      return billingHistoryEmptyRef;
    case "contract_empty_24":
    case "contract_empty_12":
    case "contract_nonzero_consumption":
    case "contract_consumption_formula":
      return undefined;
    default:
      return undefined;
  }
}

export function resolveBillingHistoryQuery(
  scenario: BillingHistoryScenario,
): BillingHistoryQuery {
  switch (scenario) {
    case "bh_limit_12":
      return { billingLimit: 12 };
    case "bh_limit_6":
      return { billingLimit: 6 };
    case "invalid_billing_limit":
      return { billingLimit: -1 };
    case "bh_ignore_unknown_query":
      return { billingLimit: 0, foo: 1 };
    case "bh_by_ivrs_all":
    case "bh_by_account":
    case "bh_by_meter":
    case "consumer_not_found":
    case "meter_not_found":
    case "empty_consumer_ref":
    default:
      return { billingLimit: 0 };
  }
}

export function resolveBillingHistoryExpectedLimit(
  scenario: BillingHistoryScenario,
): number {
  const query = resolveBillingHistoryQuery(scenario);
  return typeof query.billingLimit === "number" ? query.billingLimit : 0;
}

export function resolveBillingHistoryContractBody(
  scenario: BillingHistoryScenario,
): BillingHistoryResponse | undefined {
  switch (scenario) {
    case "contract_empty_24":
      return billingHistoryContractEmpty24Response;
    case "contract_empty_12":
      return billingHistoryContractEmpty12Response;
    case "contract_nonzero_consumption":
      return billingHistoryContractNonzeroResponse;
    case "contract_consumption_formula":
      return billingHistoryContractConsumptionFormulaResponse;
    default:
      return undefined;
  }
}

export const billingHistoryTestCases: BillingHistoryTestCase[] = [
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/billing-history?billingLimit=0 — 24 IST month rows",
    scenario: "bh_by_ivrs_all",
    tags: ["@smoke", "@consumer", "@billing", "@billing-history"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/billing-history?billingLimit=12 — last 12 months",
    scenario: "bh_limit_12",
    tags: ["@consumer", "@billing", "@billing-history", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/billing-history?billingLimit=6 — last 6 months",
    scenario: "bh_limit_6",
    tags: ["@consumer", "@billing", "@billing-history", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/billing-history — resolve by account id",
    scenario: "bh_by_account",
    tags: ["@consumer", "@billing", "@billing-history", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/billing-history — resolve by meter lookup id",
    scenario: "bh_by_meter",
    tags: ["@consumer", "@billing", "@billing-history", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/billing-history — unknown query params ignored",
    scenario: "bh_ignore_unknown_query",
    tags: ["@consumer", "@billing", "@billing-history", "@edge"],
  },
  {
    testName:
      "Contract — billingLimit=0 empty archive with 24 month labels and em-dash summary",
    scenario: "contract_empty_24",
    isContractFixture: true,
    tags: ["@consumer", "@billing", "@billing-history", "@edge"],
  },
  {
    testName:
      "Contract — billingLimit=12 empty archive with 12 month labels",
    scenario: "contract_empty_12",
    isContractFixture: true,
    tags: ["@consumer", "@billing", "@billing-history", "@edge"],
  },
  {
    testName:
      "Contract — nonzero consumptionKwh with billAmount and paymentStatus stubs null",
    scenario: "contract_nonzero_consumption",
    isContractFixture: true,
    tags: ["@consumer", "@billing", "@billing-history", "@edge"],
  },
  {
    testName:
      "Contract — period kWh matches max(0, cum − prevCum) from archive cumulative registers",
    scenario: "contract_consumption_formula",
    isContractFixture: true,
    tags: ["@consumer", "@billing", "@billing-history", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/billing-history — consumer not found or empty calendar",
    scenario: "consumer_not_found",
    tags: ["@consumer", "@billing", "@billing-history", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/billing-history — unknown meter not found or empty calendar",
    scenario: "meter_not_found",
    tags: ["@consumer", "@billing", "@billing-history", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ref}/billing-history — blank consumer ref rejected",
    scenario: "empty_consumer_ref",
    expectedStatus: 400,
    tags: ["@consumer", "@billing", "@billing-history", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/billing-history — negative billingLimit rejected",
    scenario: "invalid_billing_limit",
    expectedStatus: 400,
    tags: ["@consumer", "@billing", "@billing-history", "@negative"],
  },
];
