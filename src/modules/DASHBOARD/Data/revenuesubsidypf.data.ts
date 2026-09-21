import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { RevenueSubsidyPfQuery } from "../Api/revenuesubsidypf.api";
import type {
  RevenueSubsidyPfResponse,
  RevenueSubsidyPfScenario,
} from "../Mapper/revenuesubsidypf.mapper";

export const revenueSubsidyPfMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const revenueSubsidyPfSuccessMessage =
  "Revenue, subsidy, and PF amounts retrieved successfully.";

export const revenueSubsidyPfEmptyPeriodMessage =
  "No revenue / subsidy / PF row for the requested period.";

export const revenueSubsidyPfSaveSuccessMessage =
  "Revenue, subsidy, and PF amounts saved successfully.";

export {
  dtrUnbalanceUnauthorizedMessage as revenueSubsidyPfUnauthorizedMessage,
  dtrUnbalanceAccessTokenInvalidMessage as revenueSubsidyPfAccessTokenInvalidMessage,
} from "./dtr-unbalance-auth.data";

/** Far-future isolated period — live POST must not clobber current-month GET. */
export const revenueSubsidyPfIsolatedSavePeriod = {
  periodYear: 2100,
  periodMonth: 12,
} as const;

export interface RevenueSubsidyPfSaveRequest {
  periodYear: number;
  periodMonth: number;
  billingAvailability: { meterCount: number; amount: number };
  billingEfficiency: { energyLu: number; amount: number };
  revenueGainedRpu: { inputLu: number; rpu: number; amount: number };
  subsidyAmount: number;
  incentivePf: { meterCount: number; amount: number };
  penaltyPf: { meterCount: number; amount: number };
  billCount: number;
}

/** Live sample from GET /indore/dashboard/revenue-subsidy-pf (Aug 2026). */
export const revenueSubsidyPfContractLiveSampleResponse: RevenueSubsidyPfResponse = {
  success: true,
  data: {
    id: "b79e1d24-f5cd-406a-bbcc-f1ddf3950a10",
    periodYear: 2026,
    periodMonth: 8,
    billingAvailability: { meterCount: 3424488, amount: 1600000 },
    billingEfficiency: { energyLu: 1521.37, amount: 3250000 },
    revenueGainedRpu: { inputLu: 41167.7, rpu: 0.28, amount: 4000000 },
    subsidyAmount: 1300000,
    incentivePf: { meterCount: 154631, amount: 900000 },
    penaltyPf: { meterCount: 73614, amount: 260000 },
    billCount: 60000,
    overallImprovement: 11310000,
    overallImprovementCr: 1.131,
    avgImprovement: 188.5,
    createdByUserId: "de489b64-c85b-4c88-aa1b-5c005f417a48",
    updatedByUserId: "c50fe3ff-260c-40a4-b367-ccfa1da5c4d8",
    createdAt: "2026-08-02T19:48:55.813Z",
    updatedAt: "2026-08-04T16:03:04.812Z",
  },
  message: revenueSubsidyPfSuccessMessage,
};

/** Contract — zero bill count (avgImprovement is null). */
export const revenueSubsidyPfContractZeroBillsResponse: RevenueSubsidyPfResponse = {
  success: true,
  data: {
    id: "00000000-0000-0000-0000-000000000001",
    periodYear: 2026,
    periodMonth: 1,
    billingAvailability: { meterCount: 0, amount: 0 },
    billingEfficiency: { energyLu: 0, amount: 0 },
    revenueGainedRpu: { inputLu: 0, rpu: 0, amount: 0 },
    subsidyAmount: 0,
    incentivePf: { meterCount: 0, amount: 0 },
    penaltyPf: { meterCount: 0, amount: 0 },
    billCount: 0,
    overallImprovement: 0,
    overallImprovementCr: 0,
    avgImprovement: null,
    createdByUserId: "00000000-0000-0000-0000-000000000002",
    updatedByUserId: "00000000-0000-0000-0000-000000000003",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  message: revenueSubsidyPfSuccessMessage,
};

/**
 * Contract — derived-field consistency:
 * avgImprovement = overallImprovement / billCount
 * overallImprovementCr = overallImprovement / 1e7
 */
export const revenueSubsidyPfContractDerivedFieldsResponse: RevenueSubsidyPfResponse = {
  success: true,
  data: {
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    periodYear: 2025,
    periodMonth: 12,
    billingAvailability: { meterCount: 100, amount: 500 },
    billingEfficiency: { energyLu: 10.5, amount: 1000 },
    revenueGainedRpu: { inputLu: 20, rpu: 0.5, amount: 1500 },
    subsidyAmount: 200,
    incentivePf: { meterCount: 5, amount: 50 },
    penaltyPf: { meterCount: 2, amount: 25 },
    billCount: 10,
    overallImprovement: 10000000,
    overallImprovementCr: 1,
    avgImprovement: 1000000,
    createdByUserId: "11111111-1111-1111-1111-111111111111",
    updatedByUserId: "22222222-2222-2222-2222-222222222222",
    createdAt: "2025-12-01T00:00:00.000Z",
    updatedAt: "2025-12-15T00:00:00.000Z",
  },
  message: revenueSubsidyPfSuccessMessage,
};

/** Live POST sample body (zeros @ 2100-12). */
export const revenueSubsidyPfIsolatedSaveRequest: RevenueSubsidyPfSaveRequest = {
  ...revenueSubsidyPfIsolatedSavePeriod,
  billingAvailability: { meterCount: 0, amount: 0 },
  billingEfficiency: { energyLu: 0, amount: 0 },
  revenueGainedRpu: { inputLu: 0, rpu: 0, amount: 0 },
  subsidyAmount: 0,
  incentivePf: { meterCount: 0, amount: 0 },
  penaltyPf: { meterCount: 0, amount: 0 },
  billCount: 0,
};

/** Contract — POST save echo (avgImprovement null when billCount 0). */
export const revenueSubsidyPfContractSaveZeroPeriodResponse: RevenueSubsidyPfResponse = {
  success: true,
  data: {
    id: "782f6b12-e303-40db-a9e8-9dea81d2f4df",
    periodYear: 2100,
    periodMonth: 12,
    billingAvailability: { meterCount: 0, amount: 0 },
    billingEfficiency: { energyLu: 0, amount: 0 },
    revenueGainedRpu: { inputLu: 0, rpu: 0, amount: 0 },
    subsidyAmount: 0,
    incentivePf: { meterCount: 0, amount: 0 },
    penaltyPf: { meterCount: 0, amount: 0 },
    billCount: 0,
    overallImprovement: 0,
    overallImprovementCr: 0,
    avgImprovement: null,
    createdByUserId: "3d8ed11c-7bdf-4672-b60f-a56123192bea",
    updatedByUserId: "3d8ed11c-7bdf-4672-b60f-a56123192bea",
    createdAt: "2026-08-13T06:05:03.287Z",
    updatedAt: "2026-08-13T06:05:03.287Z",
  },
  message: revenueSubsidyPfSaveSuccessMessage,
};

export interface RevenueSubsidyPfTestCase {
  testName: string;
  scenario: RevenueSubsidyPfScenario;
  method?: "GET" | "POST";
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export function resolveRevenueSubsidyPfQuery(
  scenario: RevenueSubsidyPfScenario,
): RevenueSubsidyPfQuery {
  switch (scenario) {
    case "dev_reject_unknown_query":
      return { foo: "bar", period: "daily" };
    default:
      return {};
  }
}

export function resolveRevenueSubsidyPfSaveRequest(
  scenario: RevenueSubsidyPfScenario,
): RevenueSubsidyPfSaveRequest | null {
  switch (scenario) {
    case "dev_live_save_isolated":
    case "contract_save_zero_period":
      return revenueSubsidyPfIsolatedSaveRequest;
    default:
      return null;
  }
}

export function resolveRevenueSubsidyPfContractBody(
  scenario: RevenueSubsidyPfScenario,
): RevenueSubsidyPfResponse | null {
  switch (scenario) {
    case "contract_live_sample":
      return revenueSubsidyPfContractLiveSampleResponse;
    case "contract_zero_bills":
      return revenueSubsidyPfContractZeroBillsResponse;
    case "contract_derived_fields":
      return revenueSubsidyPfContractDerivedFieldsResponse;
    case "contract_save_zero_period":
      return revenueSubsidyPfContractSaveZeroPeriodResponse;
    default:
      return null;
  }
}

export const revenueSubsidyPfTestCases: RevenueSubsidyPfTestCase[] = [
  {
    testName: "Revenue subsidy (power factor) — report opens for the selected period",
    scenario: "dev_live_primary",
    method: "GET",
    tags: ["@smoke", "@dashboard", "@revenue-subsidy-pf"],
    nonEmptyExpected: true,
  },
  {
    testName: "Revenue subsidy (power factor) — extra unused filters are rejected",
    scenario: "dev_reject_unknown_query",
    method: "GET",
    expectedStatus: 400,
    tags: ["@negative", "@dashboard", "@revenue-subsidy-pf", "@edge"],
    nonEmptyExpected: false,
  },
  // Write tests are off. Uncomment to re-enable POST save.
  // {
  //   testName:
  //     "POST /indore/dashboard/revenue-subsidy-pf — live save isolated 2100-12",
  //   scenario: "dev_live_save_isolated",
  //   method: "POST",
  //   tags: ["@smoke", "@dashboard", "@revenue-subsidy-pf", "@write"],
  // },
  {
    testName: "Saved example — live sample shape + derived fields",
    scenario: "contract_live_sample",
    isContractFixture: true,
    tags: ["@contract", "@dashboard", "@revenue-subsidy-pf"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — zero bills / null avgImprovement",
    scenario: "contract_zero_bills",
    isContractFixture: true,
    tags: ["@contract", "@dashboard", "@revenue-subsidy-pf"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — derived avgImprovement / Cr consistency",
    scenario: "contract_derived_fields",
    isContractFixture: true,
    tags: ["@contract", "@dashboard", "@revenue-subsidy-pf"],
    nonEmptyExpected: false,
  },
  {
    testName: "Saved example — POST save zero period echo",
    scenario: "contract_save_zero_period",
    isContractFixture: true,
    tags: ["@contract", "@dashboard", "@revenue-subsidy-pf", "@write"],
    nonEmptyExpected: false,
  },
];
