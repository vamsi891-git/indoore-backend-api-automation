import { REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { AberrationsQuery } from "../Mapper/aberrations.mapper";
export const aberrationsMaxResponseTimeMs =
  REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS;
/** Baseline query mirrors the documented sample request. */
export const aberrationsDefaultQuery: AberrationsQuery = {
  organisationLookupId: 3,
  month: "FEB",
  year: 2025,
  servicePointMeterPhaseTblRefId: 1,
  categoryTblRefId: 12,
  eventTblRefId: 42,
  page: 1,
  limit: 10,
};
export const aberrationsSmallPageQuery: AberrationsQuery = {
  ...aberrationsDefaultQuery,
  page: 1,
  limit: 5,
};
export const aberrationsSecondPageQuery: AberrationsQuery = {
  ...aberrationsDefaultQuery,
  page: 2,
  limit: 5,
};

export interface AberrationsTestCase {
  testName: string;
  query: AberrationsQuery;
  tags: string[];
}
export const aberrationsTestCases: AberrationsTestCase[] = [
  {
    testName:
      "Validate GET /indore/revenue-protection/aberrations — default page (FEB 2025)",
    query: { ...aberrationsDefaultQuery },
    tags: ["@smoke", "@revenue-protection", "@aberrations"],
  },
  {
    testName: "Validate pagination — smaller page size (limit 5)",
    query: { ...aberrationsSmallPageQuery },
    tags: ["@revenue-protection", "@aberrations"],
  },
  {
    testName: "Validate pagination — page 2 (limit 5)",
    query: { ...aberrationsSecondPageQuery },
    tags: ["@revenue-protection", "@aberrations"],
  },
];

export const EXPECTED_ABERRATION_COLUMN_KEYS = [
  "circle",
  "month",
  "year",
  "noOfCases",
  "totalCasesAttended",
  "pending",
  "amountBilled",
  "amountRealisation",
] as const;
