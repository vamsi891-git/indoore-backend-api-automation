import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { CollectionReportQuery } from "../Api/collection-report.api";
import type {
  CollectionReportResponse,
  CollectionReportScenario,
} from "../Mapper/collection-report.mapper";

export const collectionReportMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** Live primary window from shared collection-report samples. */
export const collectionReportDefaultFromDate = "2025-10-01";
export const collectionReportDefaultToDate = "2025-10-30";
export const collectionReportGaspDate = "2025-10-01";
export const collectionReportDefaultPage = 1;
export const collectionReportDefaultLimit = 10;
export const collectionReportBeyondPage = 99999;
export const collectionReportDefaultImbalanceThreshold = 5;
export const collectionReportDefaultCurrentMismatchThreshold = 1;
export const collectionReportDefaultLowConsumptionThreshold = 30;

export const COLLECTION_REPORT_TYPES = [
  "current-mismatch",
  "neutral-zero-phase-current",
  "current-imbalance",
  "no-load",
  "leakage",
  "current-analysis",
  "voltage-analysis",
  "alarm-last-gasp",
  "alarm-first-gasp",
] as const;

export type CollectionReportType = (typeof COLLECTION_REPORT_TYPES)[number];

export type CollectionReportColumnDef = { key: string; header: string };

const HIERARCHY_COLUMNS: CollectionReportColumnDef[] = [
  { key: "slNo", header: "SL NO" },
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "substation", header: "Substation" },
  { key: "feeder", header: "Feeder" },
  { key: "dtr", header: "DTR" },
  { key: "consumerName", header: "Consumer Name" },
  { key: "address", header: "Address" },
  { key: "ivrsNumber", header: "IVRS Number" },
  { key: "category", header: "Category" },
  { key: "meterSerialNumber", header: "Meter Serial Number" },
  { key: "phase", header: "Phase" },
  { key: "sanctionedLoadKw", header: "Sanctioned Load (kW)" },
  { key: "serviceDate", header: "Service Date" },
];

const TELEMETRY_METRIC_COLUMNS: CollectionReportColumnDef[] = [
  { key: "eventCount", header: "Event Count" },
  { key: "durationHhMm", header: "Duration (HH:MM)" },
  { key: "maxIR", header: "Max IR" },
  { key: "maxIN", header: "Max IN" },
  { key: "avgIR", header: "Avg IR" },
  { key: "avgIN", header: "Avg IN" },
  { key: "maxMdKva", header: "Max MD kVA" },
  { key: "mdDate", header: "MD Date" },
  { key: "avgVoltage", header: "Avg Voltage" },
  { key: "maxVoltage", header: "Max Voltage" },
  { key: "isZeroConsumption", header: "Zero Consumption" },
  { key: "isLowConsumption", header: "Low Consumption" },
  { key: "ipCount", header: "IP Count" },
  { key: "kwh30Day", header: "kWh 30 Day" },
];

function kwhDayColumns(): CollectionReportColumnDef[] {
  return Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    return { key: `kwh${day}`, header: `kWh Day ${day}` };
  });
}

/** current-mismatch / neutral-zero / no-load */
export const EXPECTED_COLLECTION_REPORT_TELEMETRY_WITH_KWH_COLUMNS: CollectionReportColumnDef[] = [
  ...HIERARCHY_COLUMNS,
  ...TELEMETRY_METRIC_COLUMNS,
  ...kwhDayColumns(),
];

/** current-imbalance / leakage */
export const EXPECTED_COLLECTION_REPORT_TELEMETRY_COLUMNS: CollectionReportColumnDef[] = [
  ...HIERARCHY_COLUMNS,
  ...TELEMETRY_METRIC_COLUMNS,
];

const ANALYSIS_BASE_COLUMNS: CollectionReportColumnDef[] = [
  ...HIERARCHY_COLUMNS,
  { key: "meterPhaseName", header: "Meter Phase" },
  { key: "phaseNameRyb", header: "Phase (R/Y/B)" },
  { key: "maxCur", header: "Max Current" },
  { key: "avgCur", header: "Avg Current" },
  { key: "rvn", header: "RVN" },
  { key: "yvn", header: "YVN" },
  { key: "bvn", header: "BVN" },
  { key: "irAvg", header: "IR Avg" },
  { key: "iyAvg", header: "IY Avg" },
  { key: "ibAvg", header: "IB Avg" },
  { key: "eventCount", header: "Event Count" },
  { key: "durationHhMm", header: "Duration (HH:MM)" },
  { key: "kwh30Day", header: "kWh 30 Day" },
];

export const EXPECTED_COLLECTION_REPORT_CURRENT_ANALYSIS_COLUMNS: CollectionReportColumnDef[] =
  ANALYSIS_BASE_COLUMNS;

export const EXPECTED_COLLECTION_REPORT_VOLTAGE_ANALYSIS_COLUMNS: CollectionReportColumnDef[] = [
  ...ANALYSIS_BASE_COLUMNS,
  { key: "maxV", header: "Max Voltage" },
  { key: "avgV", header: "Avg Voltage" },
  { key: "eventDuration", header: "Event Duration" },
];

/**
 * Alarm GASP success column grid is not locked yet — validate hierarchy prefix only
 * when a live 200 lands.
 */
export const EXPECTED_COLLECTION_REPORT_GASP_COLUMN_PREFIX: CollectionReportColumnDef[] =
  HIERARCHY_COLUMNS;

export function expectedColumnsForReportType(
  reportType: CollectionReportType,
): CollectionReportColumnDef[] | null {
  switch (reportType) {
    case "current-mismatch":
    case "neutral-zero-phase-current":
    case "no-load":
      return EXPECTED_COLLECTION_REPORT_TELEMETRY_WITH_KWH_COLUMNS;
    case "current-imbalance":
    case "leakage":
      return EXPECTED_COLLECTION_REPORT_TELEMETRY_COLUMNS;
    case "current-analysis":
      return EXPECTED_COLLECTION_REPORT_CURRENT_ANALYSIS_COLUMNS;
    case "voltage-analysis":
      return EXPECTED_COLLECTION_REPORT_VOLTAGE_ANALYSIS_COLUMNS;
    case "alarm-last-gasp":
    case "alarm-first-gasp":
      return null;
    default:
      return null;
  }
}

/** Report types that commonly return matching rows in the Oct 2025 window. */
export const COLLECTION_REPORT_NONEMPTY_TYPES: CollectionReportType[] = [
  "current-mismatch",
  "neutral-zero-phase-current",
  "no-load",
];

/** Empty matching rows are valid in regression (meters scanned, none matched). */
export const COLLECTION_REPORT_EMPTY_OK_TYPES: CollectionReportType[] = [
  "current-imbalance",
  "leakage",
  "current-analysis",
  "voltage-analysis",
];

function primaryQuery(
  reportType: CollectionReportType,
  overrides: Partial<CollectionReportQuery> = {},
): CollectionReportQuery {
  return {
    reportType,
    fromDate: collectionReportDefaultFromDate,
    toDate: collectionReportDefaultToDate,
    page: collectionReportDefaultPage,
    limit: collectionReportDefaultLimit,
    imbalanceThreshold: collectionReportDefaultImbalanceThreshold,
    currentMismatchThreshold: collectionReportDefaultCurrentMismatchThreshold,
    lowConsumptionThreshold: collectionReportDefaultLowConsumptionThreshold,
    ...overrides,
  };
}

function gaspQuery(
  reportType: "alarm-last-gasp" | "alarm-first-gasp",
  overrides: Partial<CollectionReportQuery> = {},
): CollectionReportQuery {
  return primaryQuery(reportType, {
    fromDate: collectionReportGaspDate,
    toDate: collectionReportGaspDate,
    ...overrides,
  });
}

/** Minimal live-shaped fixture for column/row duplicate contract checks. */
export const collectionReportContractMismatchSample: CollectionReportResponse = {
  success: true,
  data: {
    columns: EXPECTED_COLLECTION_REPORT_TELEMETRY_WITH_KWH_COLUMNS,
    rows: [
      {
        id: "meter-97792540",
        slNo: 1,
        meterLookupId: 1134,
        circle: "Indore city circle",
        division: "CENTRAL",
        zone: "Hawabangla",
        substation: "PragatiNagar",
        feeder: "PARMANU NAGAR(CHQ)",
        dtr: "RJ664",
        consumerName: "ANIL SONI",
        address: "sample",
        ivrsNumber: "N3008012424",
        category: "Residential",
        meterSerialNumber: "97792540",
        phase: "1 PH",
        sanctionedLoadKw: "1",
        serviceDate: "12-08-2018 02:14",
        eventCount: 8,
        durationHhMm: "1:41",
        maxIR: 1.09,
        maxIN: 5.77,
        avgIR: 0.813,
        avgIN: 4.554,
        maxMdKva: 2.53,
        mdDate: "09-10-2025 08:10",
        avgVoltage: 234.09,
        maxVoltage: 241.42,
        isZeroConsumption: false,
        isLowConsumption: false,
        ipCount: 10,
        kwh30Day: 150.31,
        kwh1: 4.86,
      },
      {
        id: "meter-85080153",
        slNo: 2,
        meterLookupId: 1168,
        circle: "Indore city circle",
        division: "CENTRAL",
        zone: "Hawabangla",
        substation: "PragatiNagar",
        feeder: "PARMANU NAGAR(CHQ)",
        dtr: "RJ6612",
        consumerName: "SH.ROOPSINGH SHERSINGH",
        address: "sample",
        ivrsNumber: "3471010720",
        category: "Residential",
        meterSerialNumber: "85080153",
        phase: "1 PH",
        sanctionedLoadKw: "2",
        serviceDate: "14-02-2023 11:25",
        eventCount: 11,
        durationHhMm: "0:26",
        maxIR: 19.3,
        maxIN: 13.92,
        avgIR: 9.66,
        avgIN: 6.99,
        maxMdKva: 4.55,
        mdDate: "13-10-2025 08:25",
        avgVoltage: 236.55,
        maxVoltage: 247.71,
        isZeroConsumption: false,
        isLowConsumption: false,
        ipCount: 130,
        kwh30Day: 255.17,
        kwh1: 9.82,
      },
    ],
    pagination: {
      page: 1,
      limit: 100,
      total: 133167,
      totalPages: 1332,
      hasMore: true,
    },
    metersFetched: 100,
    hasMore: true,
    nextMeterLookupId: 1203,
  },
};

export const collectionReportContractEmptyRows: CollectionReportResponse = {
  success: true,
  data: {
    columns: EXPECTED_COLLECTION_REPORT_TELEMETRY_COLUMNS,
    rows: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 133167,
      totalPages: 13317,
      hasMore: true,
    },
    metersFetched: 10,
    hasMore: true,
    nextMeterLookupId: 1105,
  },
};

export interface CollectionReportTestCase {
  testName: string;
  scenario: CollectionReportScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;
  /** Smoke: primary list must be non-empty. */
  nonEmptyExpected?: boolean;
  /** Empty matching rows are allowed (meters may still be scanned). */
  emptyRowsOk?: boolean;
}

export function reportTypeForScenario(
  scenario: CollectionReportScenario,
): CollectionReportType | undefined {
  switch (scenario) {
    case "dev_current_mismatch":
    case "dev_current_mismatch_page2":
    case "dev_current_mismatch_limit_one":
    case "dev_current_mismatch_page_beyond":
    case "dev_current_mismatch_keyset":
    case "dev_ignore_unknown_query":
    case "contract_current_mismatch_sample":
    case "invalid_date_range":
    case "invalid_date_format":
    case "invalid_to_date":
    case "missing_from_date":
    case "missing_to_date":
    case "invalid_page":
    case "invalid_limit":
      return "current-mismatch";
    case "dev_neutral_zero":
      return "neutral-zero-phase-current";
    case "dev_current_imbalance":
    case "contract_empty_rows":
      return "current-imbalance";
    case "dev_no_load":
      return "no-load";
    case "dev_leakage":
      return "leakage";
    case "dev_current_analysis":
      return "current-analysis";
    case "dev_voltage_analysis":
      return "voltage-analysis";
    case "dev_alarm_last_gasp":
    case "dev_alarm_last_gasp_range_rejected":
      return "alarm-last-gasp";
    case "dev_alarm_first_gasp":
    case "dev_alarm_first_gasp_range_rejected":
      return "alarm-first-gasp";
    case "missing_report_type":
    case "invalid_report_type":
      return undefined;
    default:
      return "current-mismatch";
  }
}

export function resolveCollectionReportQuery(
  scenario: CollectionReportScenario,
): CollectionReportQuery {
  const reportType = reportTypeForScenario(scenario) ?? "current-mismatch";

  switch (scenario) {
    case "dev_current_mismatch_page2":
      return primaryQuery(reportType, { page: 2 });
    case "dev_current_mismatch_limit_one":
      return primaryQuery(reportType, { limit: 1 });
    case "dev_current_mismatch_page_beyond":
      return primaryQuery(reportType, { page: collectionReportBeyondPage });
    case "dev_current_mismatch_keyset":
      // Placeholder afterId; live keyset test overrides with nextMeterLookupId.
      return primaryQuery(reportType, {
        afterMeterLookupId: 1,
        page: 1,
      });
    case "dev_ignore_unknown_query":
      return primaryQuery(reportType, { foo: "bar", unused: 1 });
    case "dev_alarm_last_gasp":
    case "dev_alarm_first_gasp":
      return gaspQuery(reportType as "alarm-last-gasp" | "alarm-first-gasp");
    case "dev_alarm_last_gasp_range_rejected":
    case "dev_alarm_first_gasp_range_rejected":
      return primaryQuery(reportType, {
        fromDate: collectionReportDefaultFromDate,
        toDate: collectionReportDefaultToDate,
      });
    case "invalid_date_range":
      return primaryQuery(reportType, {
        fromDate: "2025-10-30",
        toDate: "2025-10-01",
      });
    case "invalid_date_format":
      return primaryQuery(reportType, { fromDate: "not-a-date" });
    case "invalid_to_date":
      return primaryQuery(reportType, { toDate: "not-a-date" });
    case "missing_from_date":
      return primaryQuery(reportType, { fromDate: undefined });
    case "missing_to_date":
      return primaryQuery(reportType, { toDate: undefined });
    case "missing_report_type":
      return {
        ...primaryQuery("current-mismatch"),
        reportType: undefined as unknown as CollectionReportType,
      };
    case "invalid_report_type":
      return {
        ...primaryQuery("current-mismatch"),
        reportType: "not-a-real-report" as CollectionReportType,
      };
    case "invalid_page":
      return primaryQuery(reportType, { page: 0 });
    case "invalid_limit":
      return primaryQuery(reportType, { limit: 0 });
    case "dev_current_mismatch":
    case "dev_neutral_zero":
    case "dev_current_imbalance":
    case "dev_no_load":
    case "dev_leakage":
    case "dev_current_analysis":
    case "dev_voltage_analysis":
    case "contract_current_mismatch_sample":
    case "contract_empty_rows":
    default:
      return primaryQuery(reportType);
  }
}

export function resolveCollectionReportContractBody(
  scenario: CollectionReportScenario,
): CollectionReportResponse | undefined {
  switch (scenario) {
    case "contract_current_mismatch_sample":
      return collectionReportContractMismatchSample;
    case "contract_empty_rows":
      return collectionReportContractEmptyRows;
    default:
      return undefined;
  }
}

export const collectionReportTestCases: CollectionReportTestCase[] = [
  {
    testName: "Collection report — current-mismatch Oct 2025 shows columns and meter rows",
    scenario: "dev_current_mismatch",
    tags: ["@smoke", "@collection-report", "@current-mismatch"],
    nonEmptyExpected: true,
  },
  {
    testName: "Collection report — neutral-zero-phase-current Oct 2025 returns matching meters",
    scenario: "dev_neutral_zero",
    tags: ["@smoke", "@collection-report", "@neutral-zero"],
    nonEmptyExpected: true,
  },
  {
    testName: "Collection report — no-load Oct 2025 returns columns (rows may be sparse)",
    scenario: "dev_no_load",
    tags: ["@smoke", "@collection-report", "@no-load"],
    nonEmptyExpected: true,
  },
  {
    testName: "Collection report — current-imbalance Oct 2025 accepts empty matching rows",
    scenario: "dev_current_imbalance",
    tags: ["@collection-report", "@current-imbalance", "@edge"],
    emptyRowsOk: true,
  },
  {
    testName: "Collection report — leakage Oct 2025 accepts empty matching rows",
    scenario: "dev_leakage",
    tags: ["@collection-report", "@leakage", "@edge"],
    emptyRowsOk: true,
  },
  {
    testName: "Collection report — current-analysis Oct 2025 (3PH) accepts empty matching rows",
    scenario: "dev_current_analysis",
    tags: ["@collection-report", "@current-analysis", "@edge"],
    emptyRowsOk: true,
  },
  {
    testName: "Collection report — voltage-analysis Oct 2025 (3PH) accepts empty matching rows",
    scenario: "dev_voltage_analysis",
    tags: ["@collection-report", "@voltage-analysis", "@edge"],
    emptyRowsOk: true,
  },
  {
    testName: "Collection report — alarm-last-gasp requires a single day (fromDate=toDate)",
    scenario: "dev_alarm_last_gasp",
    tags: ["@collection-report", "@alarm-gasp", "@edge"],
    emptyRowsOk: true,
  },
  {
    testName: "Collection report — alarm-first-gasp requires a single day (fromDate=toDate)",
    scenario: "dev_alarm_first_gasp",
    tags: ["@collection-report", "@alarm-gasp", "@edge"],
    emptyRowsOk: true,
  },
  {
    testName: "Collection report — alarm-last-gasp rejects a date range (fromDate ≠ toDate)",
    scenario: "dev_alarm_last_gasp_range_rejected",
    expectedStatus: 400,
    tags: ["@collection-report", "@alarm-gasp", "@negative"],
  },
  {
    testName: "Collection report — alarm-first-gasp rejects a date range (fromDate ≠ toDate)",
    scenario: "dev_alarm_first_gasp_range_rejected",
    expectedStatus: 400,
    tags: ["@collection-report", "@alarm-gasp", "@negative"],
  },
  {
    testName: "Collection report — current-mismatch page 2 continues without duplicate meters",
    scenario: "dev_current_mismatch_page2",
    tags: ["@collection-report", "@edge", "@duplicates"],
    emptyRowsOk: true,
  },
  {
    testName: "Collection report — current-mismatch limit 1 returns at most 1 matching row",
    scenario: "dev_current_mismatch_limit_one",
    tags: ["@collection-report", "@edge"],
    emptyRowsOk: true,
  },
  {
    testName: "Collection report — current-mismatch page far beyond still returns a valid envelope",
    scenario: "dev_current_mismatch_page_beyond",
    tags: ["@collection-report", "@edge"],
    emptyRowsOk: true,
  },
  {
    testName: "Collection report — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@collection-report", "@edge"],
    emptyRowsOk: true,
  },
  {
    testName: "Collection report — current-mismatch fixture columns and uniqueness",
    scenario: "contract_current_mismatch_sample",
    isContractFixture: true,
    tags: ["@collection-report", "@contract-snapshot"],
    nonEmptyExpected: true,
  },
  {
    testName: "Collection report — empty matching rows fixture",
    scenario: "contract_empty_rows",
    isContractFixture: true,
    tags: ["@collection-report", "@contract-snapshot"],
    emptyRowsOk: true,
  },
  {
    testName: "Collection report — fromDate after toDate is rejected",
    scenario: "invalid_date_range",
    expectedStatus: 400,
    tags: ["@collection-report", "@negative"],
  },
  {
    testName: "Collection report — invalid fromDate is rejected",
    scenario: "invalid_date_format",
    expectedStatus: 400,
    tags: ["@collection-report", "@negative"],
  },
  {
    testName: "Collection report — invalid toDate is rejected",
    scenario: "invalid_to_date",
    expectedStatus: 400,
    tags: ["@collection-report", "@negative"],
  },
  {
    testName: "Collection report — missing fromDate is rejected",
    scenario: "missing_from_date",
    expectedStatus: 400,
    tags: ["@collection-report", "@negative"],
  },
  {
    testName: "Collection report — missing toDate is rejected",
    scenario: "missing_to_date",
    expectedStatus: 400,
    tags: ["@collection-report", "@negative"],
  },
  {
    testName: "Collection report — missing reportType is rejected",
    scenario: "missing_report_type",
    expectedStatus: 400,
    tags: ["@collection-report", "@negative"],
  },
  {
    testName: "Collection report — unknown reportType is rejected",
    scenario: "invalid_report_type",
    expectedStatus: 400,
    tags: ["@collection-report", "@negative"],
  },
  {
    testName: "Collection report — page 0 is rejected",
    scenario: "invalid_page",
    expectedStatus: 400,
    tags: ["@collection-report", "@negative"],
  },
  {
    testName: "Collection report — limit 0 is rejected",
    scenario: "invalid_limit",
    expectedStatus: 400,
    tags: ["@collection-report", "@negative"],
  },
];
