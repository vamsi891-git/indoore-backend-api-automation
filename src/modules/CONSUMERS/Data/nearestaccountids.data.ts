import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { NearestAccountIdsScenario } from "../Mapper/nearestaccountids.mapper";
import type { NearestAccountIdsQuery } from "../Api/nearestaccountids.api";
export const nearestAccountIdsMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;
/** Live account with geo neighbors (override via NEAREST_ACCOUNT_IDS_ACCOUNT_ID). */
export const nearestAccountIdsDefaultAccountId = "N3374018980";
export const nearestAccountIdsNoNumericAccountId = "ABC_NO_DIGITS";
export const nearestAccountIdsPrefixedAccountId = "N8787878787";
export interface NearestAccountIdsTestCase {
  testName: string;
  scenario: NearestAccountIdsScenario;
  expectedStatus?: number;
  query?: NearestAccountIdsQuery;
  tags: string[];
}
export function resolveNearestAccountIdsQuery(
  scenario: NearestAccountIdsScenario,
): NearestAccountIdsQuery | undefined {
  switch (scenario) {
    case "nearest_found":
      return {
        accountId:
          process.env.NEAREST_ACCOUNT_IDS_ACCOUNT_ID?.trim() ||
          nearestAccountIdsDefaultAccountId,
        limit: 10,
      };
    case "default_limit":
      return {
        accountId:
          process.env.NEAREST_ACCOUNT_IDS_ACCOUNT_ID?.trim() ||
          nearestAccountIdsDefaultAccountId,
      };
    case "custom_limit":
      return {
        accountId:
          process.env.NEAREST_ACCOUNT_IDS_ACCOUNT_ID?.trim() ||
          nearestAccountIdsDefaultAccountId,
        limit: 1,
      };
    case "max_distance_empty":
      return {
        accountId:
          process.env.NEAREST_ACCOUNT_IDS_ACCOUNT_ID?.trim() ||
          nearestAccountIdsDefaultAccountId,
        limit: 10,
        maxDistance: 1,
      };
    case "no_numeric_suffix":
      return {
        accountId: nearestAccountIdsNoNumericAccountId,
        limit: 10,
      };
    case "prefixed_account_id":
      return {
        accountId: nearestAccountIdsPrefixedAccountId,
        limit: 5,
      };
    case "missing_account_id":
    case "empty_account_id":
    case "invalid_limit_zero":
    case "invalid_limit_max":
      return undefined;
    default:
      return undefined;
  }
}
export const nearestAccountIdsTestCases: NearestAccountIdsTestCase[] = [
  {
    testName:
      "Nearby accounts — similar account numbers are listed",
    scenario: "nearest_found",
    tags: ["@smoke", "@consumer", "@nearest-account-ids"],
  },
  {
    testName:
      "Nearby accounts — default list shows up to 10 accounts",
    scenario: "default_limit",
    tags: ["@consumer", "@nearest-account-ids", "@edge"],
  },
  {
    testName:
      "Nearby accounts — list size can be limited",
    scenario: "custom_limit",
    tags: ["@consumer", "@nearest-account-ids", "@edge"],
  },
  {
    testName:
      "Nearby accounts — very close match range can return none",
    scenario: "max_distance_empty",
    tags: ["@consumer", "@nearest-account-ids", "@negative"],
  },
  {
    testName:
      "Nearby accounts — letters-only account has no neighbours",
    scenario: "no_numeric_suffix",
    tags: ["@consumer", "@nearest-account-ids", "@negative"],
  },
  {
    testName:
      "Nearby accounts — number at the end of the account is used",
    scenario: "prefixed_account_id",
    tags: ["@consumer", "@nearest-account-ids", "@edge"],
  },
  {
    testName:
      "Nearby accounts — account number is required",
    scenario: "missing_account_id",
    expectedStatus: 400,
    tags: ["@consumer", "@nearest-account-ids", "@negative"],
  },
  {
    testName:
      "Nearby accounts — empty account number is rejected",
    scenario: "empty_account_id",
    expectedStatus: 400,
    tags: ["@consumer", "@nearest-account-ids", "@negative"],
  },
  {
    testName:
      "Nearby accounts — list size cannot be zero",
    scenario: "invalid_limit_zero",
    expectedStatus: 400,
    tags: ["@consumer", "@nearest-account-ids", "@negative"],
  },
  {
    testName:
      "Nearby accounts — list size cannot be more than 20",
    scenario: "invalid_limit_max",
    expectedStatus: 400,
    tags: ["@consumer", "@nearest-account-ids", "@negative"],
  },
];
