import type { AtrReportQuery, AtrReportType } from "../Mapper/atr-report.mapper";
import { REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";

export const atrReportMaxResponseTimeMs = REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS;

/** UI dropdown labels → API reportType (screenshots). */
export const ATR_REPORT_TYPES = [
  {
    reportType: "billingEfficiencyDetails" as const,
    label: "Billing Efficiency Details",
  },
  {
    reportType: "billingEfficiencySummary" as const,
    label: "Billing Efficiency Summary",
  },
  {
    reportType: "disconnectionDetails" as const,
    label: "Disconnection Details",
  },
  {
    reportType: "disconnectionSummary" as const,
    label: "Disconnection Summary",
  },
  {
    reportType: "pfMdDetails" as const,
    label: "PF MD Details",
  },
  {
    reportType: "billingEfficiencyBaseline" as const,
    label: "Billing Efficiency Baseline",
  },
  {
    reportType: "aberrationsDetails" as const,
    label: "Aberrations Details",
  },
  {
    reportType: "meterNonCommunicationRemarks" as const,
    label: "Meter Non-Communication Remarks",
  },
] as const;

/** Expected column keys per reportType (live atr-report responses). */
export const EXPECTED_ATR_REPORT_COLUMNS: Record<
  AtrReportType,
  readonly { key: string; header: string }[]
> = {
  billingEfficiencyDetails: [
    { key: "year", header: "Year" },
    { key: "month", header: "Month" },
    { key: "feederName", header: "Feeder" },
    { key: "totalUnitsKwh", header: "Total Units(kWh)" },
    { key: "soldUnitsKwh", header: "Sold Units (kWh)" },
    { key: "billingEfficiencyPercentage", header: "Billing Efficiency (%)" },
    { key: "unitsGainKwh", header: "Units Gain(kWh)" },
    { key: "revenueGainInRs", header: "Revenue Gain (In Rs)" },
  ],
  billingEfficiencySummary: [
    { key: "year", header: "Year" },
    { key: "feederName", header: "Feeder" },
    { key: "totalUnitsKwh", header: "Total Units (kWh)" },
    { key: "soldUnitsKwh", header: "Sold Units (kWh)" },
    { key: "billingEfficiencyPercentage", header: "Billing Efficiency (%)" },
    { key: "unitsGainKwh", header: "Units Gain (kWh)" },
    { key: "revenueGainInRs", header: "Revenue Gain (In Rs)" },
  ],
  disconnectionDetails: [
    { key: "year", header: "Year" },
    { key: "month", header: "Month" },
    { key: "feederName", header: "Feeder" },
    { key: "newDisconnection", header: "New Disconnection" },
    { key: "oldPendingDisconnection", header: "Old Pending Disconnection" },
    { key: "totalDisconnection", header: "Total Disconnection" },
    { key: "expectedAmtInRs", header: "Expected Amt(In Rs)" },
    { key: "oldPendingAmtInRs", header: "Old Pending Amt(In Rs)" },
    { key: "totalAmtInRs", header: "Total Amt(In Rs)" },
    { key: "reconnectionCount", header: "Reconnection Count" },
    { key: "reconnectionAmtInRs", header: "Reconnection Amt(In Rs)" },
    { key: "rcdcAmtInRs", header: "RCDC Amt(In Rs)" },
    { key: "totalAmtRealisedInRs", header: "Total Amt Realised(In Rs)" },
    { key: "entryDateTime", header: "Entry Date Time" },
  ],
  disconnectionSummary: [
    { key: "feederName", header: "Feeder" },
    { key: "newDisconnection", header: "New Disconnection" },
    { key: "oldPendingDisconnection", header: "Old Pending Disconnection" },
    { key: "totalDisconnection", header: "Total Disconnection" },
    { key: "expectedAmtInRs", header: "Expected Amt(In Rs)" },
    { key: "oldPendingAmtInRs", header: "Old Pending Amt(In Rs)" },
    { key: "totalAmtInRs", header: "Total Amt(In Rs)" },
    { key: "reconnectionCount", header: "Reconnection Count" },
    { key: "reconnectionAmtInRs", header: "Reconnection Amt(In Rs)" },
    { key: "rcdcAmtInRs", header: "RCDC Amt(In Rs)" },
    { key: "totalAmtRealisedInRs", header: "Total Amt Realised(In Rs)" },
  ],
  pfMdDetails: [
    { key: "feederId", header: "Feeder Id" },
    { key: "feederName", header: "Feeder Name" },
    { key: "mdCasesCount", header: "MD Cases" },
    { key: "mdAmount", header: "MD Amount" },
    { key: "pfCasesCount", header: "PF Cases" },
    { key: "pfAmount", header: "PF Amount" },
    { key: "totalCases", header: "Total Cases" },
    { key: "totalAmount", header: "Total Amount" },
  ],
  billingEfficiencyBaseline: [
    { key: "feederName", header: "Feeder Name" },
    { key: "totalInputKwh", header: "Total Input kWh" },
    { key: "htConsumerCount", header: "HT Consumer Count" },
    { key: "ltConsumerCount", header: "LT Consumer Count" },
    { key: "totalConsumerCount", header: "Total Consumer Count" },
    { key: "htSoldKwh", header: "HT Sold kWh" },
    { key: "ltSoldKwh", header: "LT Sold kWh" },
    { key: "totalSoldKwh", header: "Total Sold kWh" },
    { key: "billingEfficiencyPercentage", header: "Billing Efficiency %" },
  ],
  aberrationsDetails: [
    { key: "year", header: "Year" },
    { key: "month", header: "Month" },
    { key: "circle", header: "Circle" },
    { key: "division", header: "Division" },
    { key: "zone", header: "Zone" },
    { key: "feeder", header: "Feeder" },
    { key: "dtr", header: "DTR" },
    { key: "feeder1", header: "Feeder Name New" },
    { key: "dtr1", header: "DTR Code New" },
    { key: "ivrs", header: "IVRS No." },
    { key: "meterSerialNumber", header: "Meter Serial No." },
    { key: "eventName", header: "Event Name" },
    { key: "eventCategory", header: "Event Category" },
    { key: "occurrenceTime", header: "Occurrence Time" },
    { key: "restorationTime", header: "Restoration Time" },
    { key: "remarks", header: "Remarks" },
    { key: "amountBilled", header: "Amt Billed" },
    { key: "amountRealised", header: "Amt Realised" },
    { key: "fieldRemarks", header: "Field Remarks" },
    { key: "p4Number", header: "P4 No." },
    { key: "p4Date", header: "P4 Date" },
    { key: "enteredByName", header: "Entered By" },
    { key: "entryDateTime", header: "Entry Date" },
  ],
  meterNonCommunicationRemarks: [
    { key: "circle", header: "Circle" },
    { key: "division", header: "Division" },
    { key: "zone", header: "Zone" },
    { key: "substation", header: "Sub Station" },
    { key: "feeder", header: "Feeder" },
    { key: "dtr", header: "DTR" },
    { key: "consumerName", header: "Consumer Name" },
    { key: "address", header: "Consumer Address" },
    { key: "ivrsNumber", header: "IVRS No." },
    { key: "meterSerialNumber", header: "MSN" },
    { key: "problem", header: "Problem" },
    { key: "remarks", header: "Remarks" },
  ],
};

/** Live baseline year where most ATR reports have rows. */
export const ATR_REPORT_BASELINE_YEAR = 2019;

/**
 * Export year overrides — large 2019+ aberrationsDetails exports return HTTP 202
 * async job (no downloadable xlsx in this environment). Use 2018 for a sync file
 * so header validation can still run for that reportType.
 */
export const ATR_REPORT_EXPORT_YEAR: Partial<Record<AtrReportType, number>> = {
  aberrationsDetails: 2018,
};

export interface AtrReportTestCase {
  testCaseId: string;
  testName: string;
  tags: string[];
  nonEmptyExpected: boolean;
  query: AtrReportQuery;
}

export const atrReportTestCases: AtrReportTestCase[] = ATR_REPORT_TYPES.map((entry, index) => {
  const n = String(index + 1).padStart(3, "0");
  return {
    testCaseId: `IND-RPT-ATR-REP-${n}`,
    testName: `IND-RPT-ATR-REP-${n} — ATR Report ${entry.label} (${entry.reportType}) year=${ATR_REPORT_BASELINE_YEAR}`,
    tags: ["@smoke", "@revenue-protection", "@atr-report", `@atr-report-${entry.reportType}`],
    // pfMdDetails currently returns empty for all probed years — still validate columns
    nonEmptyExpected: entry.reportType !== "pfMdDetails",
    query: {
      reportType: entry.reportType,
      year: ATR_REPORT_BASELINE_YEAR,
      page: 1,
      limit: 10,
    },
  };
});

export const atrReportExportTestCases: AtrReportTestCase[] = ATR_REPORT_TYPES.map(
  (entry, index) => {
    const n = String(index + 1).padStart(3, "0");
    const year = ATR_REPORT_EXPORT_YEAR[entry.reportType] ?? ATR_REPORT_BASELINE_YEAR;
    return {
      testCaseId: `IND-RPT-ATR-EXP-${n}`,
      testName: `IND-RPT-ATR-EXP-${n} — Export ${entry.label} (${entry.reportType}) year=${year} headers match list API`,
      tags: [
        "@smoke",
        "@revenue-protection",
        "@atr-report",
        "@atr-report-export",
        `@atr-report-${entry.reportType}`,
      ],
      nonEmptyExpected: entry.reportType !== "pfMdDetails",
      query: {
        reportType: entry.reportType,
        year,
        page: 1,
        limit: 10,
      },
    };
  },
);
