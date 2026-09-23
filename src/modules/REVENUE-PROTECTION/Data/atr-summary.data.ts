import type {
  AtrSummaryHierarchyLevel,
  AtrSummaryQuery,
  AtrSummaryDetailsQuery,
  AtrSummaryReportType,
} from "../Mapper/atr-summary.types";
import { REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";

export const atrSummaryMaxResponseTimeMs = REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS;

/** Live probe year/month with billingEfficiency data (Indore city circle). */
export const ATR_SUMMARY_YEAR = 2019;
export const ATR_SUMMARY_MONTH = 6;

export const ATR_SUMMARY_REPORT_TYPES = [
  {
    reportType: "billingEfficiency" as const,
    label: "Billing Efficiency",
  },
  {
    reportType: "disconnectionSummary" as const,
    label: "Disconnection Summary",
  },
  {
    reportType: "aberration" as const,
    label: "Aberration",
  },
] as const;

/** Metric columns shared across hierarchy levels for billingEfficiency. */
export const EXPECTED_BILLING_EFFICIENCY_METRIC_COLUMNS = [
  { key: "month", header: "Month" },
  { key: "billingEfficiency", header: "Billing Efficiency %" },
  { key: "unitsGain", header: "Units Gain" },
  { key: "revenueGain", header: "Revenue Gain" },
] as const;

/** Hierarchy label column key/header by level (billingEfficiency). */
export const EXPECTED_BILLING_EFFICIENCY_HIERARCHY_COLUMN: Record<
  Exclude<AtrSummaryHierarchyLevel, "dtr">,
  { key: string; header: string }
> = {
  circle: { key: "circle", header: "Circle" },
  division: { key: "division", header: "Division" },
  zone: { key: "zone", header: "Zone" },
  feeder: { key: "feeder", header: "Feeder" },
};

export function expectedBillingEfficiencyColumns(
  level: Exclude<AtrSummaryHierarchyLevel, "dtr">,
): readonly { key: string; header: string }[] {
  return [
    EXPECTED_BILLING_EFFICIENCY_HIERARCHY_COLUMN[level],
    ...EXPECTED_BILLING_EFFICIENCY_METRIC_COLUMNS,
  ];
}

/** Five divisions under Indore city circle (user: east/west/south/north/central). */
export const EXPECTED_DIVISION_NAMES = ["CENTRAL", "EAST", "NORTH", "SOUTH", "WEST"] as const;

export interface AtrSummaryTestCase {
  testCaseId: string;
  testName: string;
  tags: string[];
  query: AtrSummaryQuery;
  hierarchyLevel: Exclude<AtrSummaryHierarchyLevel, "dtr">;
  nonEmptyExpected: boolean;
}

export const atrSummaryCircleSmokeCases: AtrSummaryTestCase[] = ATR_SUMMARY_REPORT_TYPES.map(
  (entry, index) => ({
    testCaseId: `IND-REV-ATR-SUM-${String(index + 1).padStart(3, "0")}`,
    testName: `Fetch ATR Summary circle — ${entry.label} (${ATR_SUMMARY_YEAR}-${String(ATR_SUMMARY_MONTH).padStart(2, "0")})`,
    tags: ["@smoke", "@atr-summary", `@atr-summary-${entry.reportType}`],
    query: {
      year: ATR_SUMMARY_YEAR,
      reportType: entry.reportType,
      hierarchyLevel: "circle",
      month: ATR_SUMMARY_MONTH,
      page: 1,
      limit: 20,
    },
    hierarchyLevel: "circle",
    nonEmptyExpected: entry.reportType === "billingEfficiency",
  }),
);

/** Summary export — headers must match list API (after stripping S.No). */
export const atrSummaryExportTestCases: AtrSummaryTestCase[] = [
  {
    testCaseId: "IND-REV-ATR-SUM-EXP-001",
    testName: `Export ATR Summary billingEfficiency circle (${ATR_SUMMARY_YEAR}-${String(ATR_SUMMARY_MONTH).padStart(2, "0")}) headers match list`,
    tags: ["@smoke", "@atr-summary", "@atr-summary-export", "@atr-summary-billingEfficiency"],
    query: {
      year: ATR_SUMMARY_YEAR,
      reportType: "billingEfficiency",
      hierarchyLevel: "circle",
      month: ATR_SUMMARY_MONTH,
      page: 1,
      limit: 20,
    },
    hierarchyLevel: "circle",
    nonEmptyExpected: true,
  },
  {
    testCaseId: "IND-REV-ATR-SUM-EXP-002",
    testName:
      "Export ATR Summary aberration division (2025-06 parentId=1 circleId=3) headers match list",
    tags: ["@smoke", "@atr-summary", "@atr-summary-export", "@atr-summary-aberration"],
    query: {
      year: 2025,
      reportType: "aberration",
      hierarchyLevel: "division",
      month: 6,
      parentId: 1,
      circleId: 3,
      page: 1,
      limit: 20,
    },
    hierarchyLevel: "division",
    nonEmptyExpected: true,
  },
  {
    testCaseId: "IND-REV-ATR-SUM-EXP-003",
    testName: `Export ATR Summary disconnectionSummary circle (${ATR_SUMMARY_YEAR}-${String(ATR_SUMMARY_MONTH).padStart(2, "0")}) headers match list`,
    tags: ["@smoke", "@atr-summary", "@atr-summary-export", "@atr-summary-disconnectionSummary"],
    query: {
      year: ATR_SUMMARY_YEAR,
      reportType: "disconnectionSummary",
      hierarchyLevel: "circle",
      month: ATR_SUMMARY_MONTH,
      page: 1,
      limit: 20,
    },
    hierarchyLevel: "circle",
    nonEmptyExpected: false,
  },
];

/** Details list/export — aberration only (API rejects other reportTypes). */
export const ATR_SUMMARY_DETAILS_YEAR = 2025;
export const ATR_SUMMARY_DETAILS_MONTH = 10;

export interface AtrSummaryDetailsTestCase {
  testCaseId: string;
  testName: string;
  tags: string[];
  query: AtrSummaryDetailsQuery;
  nonEmptyExpected: boolean;
}

export const atrSummaryDetailsExportTestCases: AtrSummaryDetailsTestCase[] = [
  {
    testCaseId: "IND-REV-ATR-SUM-DET-EXP-001",
    testName: `Export ATR Summary details aberration (${ATR_SUMMARY_DETAILS_YEAR}-${String(ATR_SUMMARY_DETAILS_MONTH).padStart(2, "0")}) headers match list`,
    tags: ["@smoke", "@atr-summary", "@atr-summary-details-export", "@atr-summary-aberration"],
    query: {
      year: ATR_SUMMARY_DETAILS_YEAR,
      reportType: "aberration",
      month: ATR_SUMMARY_DETAILS_MONTH,
      page: 1,
      limit: 20,
    },
    nonEmptyExpected: true,
  },
];

export type { AtrSummaryReportType, AtrSummaryHierarchyLevel };
