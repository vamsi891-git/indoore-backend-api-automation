import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { BillingMdSnapshotQuery as BillingMdSnapshotApiQuery } from "../Api/billingmdsnapshot.api";
import type {
  BillingMdSnapshotColumn,
  BillingMdSnapshotResponse,
  BillingMdSnapshotScenario,
} from "../Mapper/billingmdsnapshot.mapper";

export type BillingMdSnapshotQuery = BillingMdSnapshotApiQuery & {
  foo?: string;
  unused?: number;
};

export const billingMdSnapshotMaxResponseTimeMs =
  MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** Live primary — GET /reports/billing-md-snapshot?month=10&year=2025&includeTotal=false */
export const billingMdSnapshotDefaultMonth = 10;
export const billingMdSnapshotDefaultYear = 2025;
export const billingMdSnapshotDefaultPage = 1;
export const billingMdSnapshotDefaultLimit = 10;
export const billingMdSnapshotBeyondPage = 99;

export const billingMdSnapshotExpectedColumns: BillingMdSnapshotColumn[] = [
  { key: "slNo", header: "S No." },
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "substation", header: "Substation" },
  { key: "feeder", header: "Feeder" },
  { key: "dtr", header: "DTR" },
  { key: "consumerName", header: "Consumer Name" },
  { key: "ivrsNumber", header: "IVRS Number" },
  { key: "meterNumber", header: "Meter Number" },
  { key: "phase", header: "Phase" },
  { key: "tariff", header: "Category" },
  { key: "sanctionedLoadKw", header: "Sanctioned Load (kW)" },
  { key: "meterTimestamp", header: "Billing Date" },
  { key: "mdKw", header: "MD kW" },
  { key: "mdKwOt", header: "MD kW OT" },
  { key: "mdKva", header: "MD kVA" },
  { key: "mdKvaOt", header: "MD kVA OT" },
  { key: "pf", header: "PF" },
  { key: "kwhC", header: "kWh (C)" },
  { key: "kvahC", header: "kVAh (C)" },
];

function primaryQuery(
  overrides: Partial<BillingMdSnapshotQuery> = {},
): BillingMdSnapshotQuery {
  return {
    month: billingMdSnapshotDefaultMonth,
    year: billingMdSnapshotDefaultYear,
    page: billingMdSnapshotDefaultPage,
    limit: billingMdSnapshotDefaultLimit,
    includeTotal: false,
    ...overrides,
  };
}

/**
 * Live sample Oct 2025 — rows present while pagination.total is 0
 * (includeTotal=false). Decimal MD fields may arrive as strings.
 */
export const billingMdSnapshotContractLiveOct2025Response: BillingMdSnapshotResponse =
  {
    success: true,
    data: {
      columns: billingMdSnapshotExpectedColumns,
      rows: [
        {
          id: "row-1-8178-85087252-N3477027402",
          slNo: 1,
          circle: "Indore city circle",
          division: "WEST",
          zone: "GPH",
          substation: "Citi Control Room",
          feeder: "RAJWADA(CHQ)",
          dtr: "WI581",
          consumerName: "SMT GANGABAI KAMEDILAL",
          ivrsNumber: "N3477027402",
          meterNumber: "85087252",
          meterLookupTblRefId: 8178,
          phase: "1 PH",
          tariff: "LV1.2",
          sanctionedLoadKw: "1.000",
          meterTimestamp: "2025-10-01 00:00",
          mdKw: "1.8340",
          mdKwOt: "2025-09-01 08:25",
          mdKva: "1.8340",
          mdKvaOt: "2025-09-01 08:25",
          pf: 0.99,
          kwhC: 7476.59,
          kvahC: 7507.01,
        },
        {
          id: "row-2-92516-92574260-N3374020617",
          slNo: 2,
          circle: "Indore city circle",
          division: "EAST",
          zone: "KHAZRANA",
          substation: "TAJ NAGAR",
          feeder: "KALIKA MATA(CHQ)",
          dtr: "IK591",
          consumerName: "NAWAB KHAN S/O KARIM KHAN",
          ivrsNumber: "N3374020617",
          meterNumber: "92574260",
          meterLookupTblRefId: 92516,
          phase: "1 PH",
          tariff: "LV1.2",
          sanctionedLoadKw: "2.000",
          meterTimestamp: "2025-10-01 00:00",
          mdKw: "0.0090",
          mdKwOt: "2025-09-04 11:25",
          mdKva: "0.0090",
          mdKvaOt: "2025-09-04 11:15",
          pf: 1,
          kwhC: 9299.89,
          kvahC: 9776.91,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        totalIsExact: true,
        hasMore: false,
      },
    },
  };

/**
 * Sparse hierarchy (meter-only). Live Oct 2025 used
 * `row-{slNo}-{meterLookupTblRefId}-{meterNumber}` when IVRS is null.
 * MD OT `1900-01-01 HH:MM` is a valid sentinel (zero MD).
 */
export const billingMdSnapshotContractSparseHierarchyResponse: BillingMdSnapshotResponse =
  {
    success: true,
    data: {
      columns: billingMdSnapshotExpectedColumns,
      rows: [
        {
          id: "row-1-45243-00262261",
          slNo: 1,
          circle: null,
          division: null,
          zone: null,
          substation: null,
          feeder: null,
          dtr: null,
          consumerName: null,
          ivrsNumber: null,
          meterNumber: "00262261",
          meterLookupTblRefId: 45243,
          phase: "1 PH",
          tariff: null,
          sanctionedLoadKw: null,
          meterTimestamp: "2025-10-01 00:00",
          mdKw: "1.1890",
          mdKwOt: "2025-09-01 19:15",
          mdKva: "1.1890",
          mdKvaOt: "2025-09-01 19:15",
          pf: 1,
          kwhC: 143.21,
          kvahC: 143.52,
        },
        {
          id: "row-2-111488-97790412-N3471032415",
          slNo: 2,
          circle: "Indore city circle",
          division: "WEST",
          zone: "Sangam Nagar",
          substation: "Sangam Nagar",
          feeder: "VRINDAVAN COLONY(CHQ)",
          dtr: "WSN921",
          consumerName: "RADHESHYAM RAGHU PAIMAL",
          ivrsNumber: "N3471032415",
          meterNumber: "97790412",
          meterLookupTblRefId: 111488,
          phase: "1 PH",
          tariff: "LV1.2",
          sanctionedLoadKw: "1.000",
          meterTimestamp: "2025-10-01 00:00",
          mdKw: "0.0000",
          mdKwOt: "1900-01-01 05:21",
          mdKva: "0.0000",
          mdKvaOt: "1900-01-01 05:21",
          pf: 0,
          kwhC: 1797.5,
          kvahC: 1916.76,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        totalIsExact: true,
        hasMore: false,
      },
    },
  };

export const billingMdSnapshotContractEmptyPageResponse: BillingMdSnapshotResponse =
  {
    success: true,
    data: {
      columns: billingMdSnapshotExpectedColumns,
      rows: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        totalIsExact: true,
        hasMore: false,
      },
    },
  };

export interface BillingMdSnapshotTestCase {
  testName: string;
  scenario: BillingMdSnapshotScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function resolveBillingMdSnapshotQuery(
  scenario: BillingMdSnapshotScenario,
): BillingMdSnapshotQuery {
  switch (scenario) {
    case "dev_live_include_total":
      return primaryQuery({ includeTotal: true });
    case "dev_live_page_beyond":
      return primaryQuery({ page: billingMdSnapshotBeyondPage });
    case "dev_limit_one":
      return primaryQuery({ limit: 1 });
    case "dev_ignore_unknown_query":
      return primaryQuery({ foo: "bar", unused: 1 });
    case "invalid_month":
      return primaryQuery({ month: 13 });
    case "invalid_year":
      return primaryQuery({ year: 0 });
    case "missing_year":
      return primaryQuery({ year: undefined });
    case "missing_month":
      return primaryQuery({ month: undefined });
    case "invalid_page":
      return primaryQuery({ page: 0 });
    case "invalid_limit":
      return primaryQuery({ limit: 0 });
    case "dev_live_without_total":
    case "contract_live_oct_2025":
    case "contract_sparse_hierarchy":
    case "contract_empty_page":
    default:
      return primaryQuery();
  }
}

export function resolveBillingMdSnapshotContractBody(
  scenario: BillingMdSnapshotScenario,
): BillingMdSnapshotResponse | undefined {
  switch (scenario) {
    case "contract_live_oct_2025":
      return billingMdSnapshotContractLiveOct2025Response;
    case "contract_sparse_hierarchy":
      return billingMdSnapshotContractSparseHierarchyResponse;
    case "contract_empty_page":
      return billingMdSnapshotContractEmptyPageResponse;
    default:
      return undefined;
  }
}

export const billingMdSnapshotTestCases: BillingMdSnapshotTestCase[] = [
  {
    testName:
      "Billing MD snapshot — Oct 2025 first page shows columns and meters",
    scenario: "dev_live_without_total",
    tags: ["@smoke", "@reports", "@billing-md-snapshot"],
    nonEmptyExpected: true,
  },
  {
    testName: "Billing MD snapshot — includeTotal still shows the same columns",
    scenario: "dev_live_include_total",
    tags: ["@reports", "@billing-md-snapshot", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Billing MD snapshot — showing 1 per page still lists a meter",
    scenario: "dev_limit_one",
    tags: ["@reports", "@billing-md-snapshot", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName:
      "Billing MD snapshot — a far page is empty or still consistent",
    scenario: "dev_live_page_beyond",
    tags: ["@reports", "@billing-md-snapshot", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Billing MD snapshot — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@reports", "@billing-md-snapshot", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName:
      "Billing MD snapshot — Oct 2025 fixture (total 0 with rows)",
    scenario: "contract_live_oct_2025",
    isContractFixture: true,
    tags: ["@reports", "@billing-md-snapshot", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Billing MD snapshot — sparse hierarchy fixture",
    scenario: "contract_sparse_hierarchy",
    isContractFixture: true,
    tags: ["@reports", "@billing-md-snapshot", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Billing MD snapshot — empty page fixture",
    scenario: "contract_empty_page",
    isContractFixture: true,
    tags: ["@reports", "@billing-md-snapshot", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Billing MD snapshot — invalid month is rejected",
    scenario: "invalid_month",
    expectedStatus: 400,
    tags: ["@reports", "@billing-md-snapshot", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Billing MD snapshot — invalid year is rejected",
    scenario: "invalid_year",
    expectedStatus: 400,
    tags: ["@reports", "@billing-md-snapshot", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Billing MD snapshot — missing year is rejected",
    scenario: "missing_year",
    expectedStatus: 400,
    tags: ["@reports", "@billing-md-snapshot", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Billing MD snapshot — missing month is rejected",
    scenario: "missing_month",
    expectedStatus: 400,
    tags: ["@reports", "@billing-md-snapshot", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Billing MD snapshot — page 0 is rejected (page must start at 1)",
    scenario: "invalid_page",
    expectedStatus: 400,
    tags: ["@reports", "@billing-md-snapshot", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Billing MD snapshot — limit 0 is rejected (limit must be at least 1)",
    scenario: "invalid_limit",
    expectedStatus: 400,
    tags: ["@reports", "@billing-md-snapshot", "@negative"],
    nonEmptyExpected: false,
  },
];
