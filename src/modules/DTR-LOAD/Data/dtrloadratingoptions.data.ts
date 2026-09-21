import { dtrLoadDefaultFromDate, dtrLoadDefaultToDate } from "./dtrload.data";

export type DtrLoadRatingOptionsScenario =
  | "live_oct"
  | "live_unknown_query"
  | "contract_oct"
  | "from_after_to"
  | "missing_from"
  | "missing_to";

export interface DtrLoadRatingOptionsQuery {
  fromDate?: string;
  toDate?: string;
  foo?: string;
}

function primaryQuery(
  overrides: Partial<DtrLoadRatingOptionsQuery> = {},
): DtrLoadRatingOptionsQuery {
  return {
    fromDate: dtrLoadDefaultFromDate,
    toDate: dtrLoadDefaultToDate,
    ...overrides,
  };
}

export function resolveDtrLoadRatingOptionsQuery(
  scenario: DtrLoadRatingOptionsScenario,
): DtrLoadRatingOptionsQuery {
  switch (scenario) {
    case "live_unknown_query":
      return primaryQuery({ foo: "bar" });
    case "from_after_to":
      return primaryQuery({
        fromDate: dtrLoadDefaultToDate,
        toDate: dtrLoadDefaultFromDate,
      });
    case "missing_from": {
      const query = primaryQuery();
      delete query.fromDate;
      return query;
    }
    case "missing_to": {
      const query = primaryQuery();
      delete query.toDate;
      return query;
    }
    default:
      return primaryQuery();
  }
}

export interface DtrLoadRatingOptionsTestCase {
  testName: string;
  scenario: DtrLoadRatingOptionsScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export const dtrLoadRatingOptionsTestCases: DtrLoadRatingOptionsTestCase[] = [
  {
    testName: "Transformer sizes — October 2025 lists each size once, smallest first",
    scenario: "live_oct",
    tags: ["@smoke", "@dtr-load"],
    nonEmptyExpected: true,
  },
  {
    testName: "Transformer sizes — leftover unused filters are ignored",
    scenario: "live_unknown_query",
    tags: ["@dtr-load", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Transformer sizes — October 2025 sample matches the live layout",
    scenario: "contract_oct",
    isContractFixture: true,
    tags: ["@dtr-load", "@edge"],
    nonEmptyExpected: false,
  },
  {
    testName: "Transformer sizes — start date after end date is rejected",
    scenario: "from_after_to",
    expectedStatus: 400,
    tags: ["@dtr-load", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Transformer sizes — leaving out the start date is rejected",
    scenario: "missing_from",
    expectedStatus: 400,
    tags: ["@dtr-load", "@negative"],
    nonEmptyExpected: false,
  },
  {
    testName: "Transformer sizes — leaving out the end date is rejected",
    scenario: "missing_to",
    expectedStatus: 400,
    tags: ["@dtr-load", "@negative"],
    nonEmptyExpected: false,
  },
];

export const dtrLoadRatingOptionsFixture = {
  success: true as const,
  data: {
    items: [
      { id: 25, value: "25" },
      { id: 63, value: "63" },
      { id: 100, value: "100" },
      { id: 200, value: "200" },
      { id: 250, value: "250" },
      { id: 300, value: "300" },
      { id: 315, value: "315" },
      { id: 500, value: "500" },
    ],
  },
};
