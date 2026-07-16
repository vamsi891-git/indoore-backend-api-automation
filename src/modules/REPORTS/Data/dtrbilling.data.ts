import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrBillingQuery } from "../Api/dtrbilling.api";

export const dtrBillingMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const dtrBillingDefaultFromDate = "2025-01-01";
export const dtrBillingDefaultToDate = "2025-01-10";
export const dtrBillingDefaultPage = 1;
export const dtrBillingDefaultLimit = 50;

export type DtrBillingScenario =
  | "dev_live_primary"
  | "dev_live_short_range"
  | "edge_duplicate_meter_serials"
  | "negative_missing_from_date"
  | "negative_invalid_date_format";

export interface DtrBillingTestCase {
  testName: string;
  tags: string[];
  scenario: DtrBillingScenario;
  expectedStatus?: number;
}

export const dtrBillingTestCases: DtrBillingTestCase[] = [
  {
    testName: "Validate DTR Billing Report API — live primary range",
    tags: ["@reports", "@dtr-billing", "@smoke", "@positive"],
    scenario: "dev_live_primary",
    expectedStatus: 200,
  },
  {
    testName: "Validate DTR Billing Report API — short date range",
    tags: ["@reports", "@dtr-billing", "@edge", "@positive"],
    scenario: "dev_live_short_range",
    expectedStatus: 200,
  },
  {
    testName:
      "Validate DTR Billing Report API — duplicate meterSerialNumbers deduped (no 500)",
    tags: ["@reports", "@dtr-billing", "@edge", "@negative"],
    scenario: "edge_duplicate_meter_serials",
    expectedStatus: 200,
  },
  {
    testName: "Validate DTR Billing Report API — missing fromDate rejected",
    tags: ["@reports", "@dtr-billing", "@negative"],
    scenario: "negative_missing_from_date",
    expectedStatus: 400,
  },
  {
    testName: "Validate DTR Billing Report API — invalid fromDate format rejected",
    tags: ["@reports", "@dtr-billing", "@negative"],
    scenario: "negative_invalid_date_format",
    expectedStatus: 400,
  },
];

/** @deprecated Use resolveDtrBillingQuery — kept for backward compatibility. */
export const DtrBillingData = {
  fromDate: dtrBillingDefaultFromDate,
  toDate: dtrBillingDefaultToDate,
  page: dtrBillingDefaultPage,
  limit: dtrBillingDefaultLimit,
  includeTotal: false,
  maxResponseTime: dtrBillingMaxResponseTimeMs,
};

export function resolveDtrBillingQuery(
  scenario: DtrBillingScenario,
): DtrBillingQuery {
  switch (scenario) {
    case "dev_live_primary":
      return {
        fromDate: dtrBillingDefaultFromDate,
        toDate: dtrBillingDefaultToDate,
        page: dtrBillingDefaultPage,
        limit: dtrBillingDefaultLimit,
        includeTotal: false,
      };
    case "dev_live_short_range":
      return {
        fromDate: "2025-12-01",
        toDate: "2025-12-02",
        page: 1,
        limit: 10,
        includeTotal: false,
      };
    case "edge_duplicate_meter_serials":
      return {
        fromDate: dtrBillingDefaultFromDate,
        toDate: dtrBillingDefaultToDate,
        page: 1,
        limit: 10,
        includeTotal: false,
        meterSerialNumbers: ["00256931", "00256931", "85129541", "85129541"],
      };
    case "negative_missing_from_date":
      return {
        fromDate: "",
        toDate: dtrBillingDefaultToDate,
        page: 1,
        limit: 10,
        includeTotal: false,
      };
    case "negative_invalid_date_format":
      return {
        fromDate: "01-01-2025",
        toDate: dtrBillingDefaultToDate,
        page: 1,
        limit: 10,
        includeTotal: false,
      };
    default:
      return {
        fromDate: dtrBillingDefaultFromDate,
        toDate: dtrBillingDefaultToDate,
        page: dtrBillingDefaultPage,
        limit: dtrBillingDefaultLimit,
        includeTotal: false,
      };
  }
}
