import { aberrationsDefaultQuery } from "./aberrations.data";

/**
 * hard-reject  → API returns 4xx + error envelope (type/pagination validation).
 * empty-success → API returns 200 + success grid with zero rows (lenient filters).
 */
export type AberrationsNegativeOutcome = "hard-reject" | "empty-success";

export interface AberrationsNegativeCase {
  testName: string;
  params: Record<string, string>;
  outcome: AberrationsNegativeOutcome;
  expectedStatuses: number[];
  tags: string[];
}

const base = {
  organisationLookupId: String(aberrationsDefaultQuery.organisationLookupId),
  month: String(aberrationsDefaultQuery.month),
  year: String(aberrationsDefaultQuery.year),
  servicePointMeterPhaseTblRefId: String(
    aberrationsDefaultQuery.servicePointMeterPhaseTblRefId,
  ),
  categoryTblRefId: String(aberrationsDefaultQuery.categoryTblRefId),
  eventTblRefId: String(aberrationsDefaultQuery.eventTblRefId),
  page: "1",
  limit: "10",
};

function omit(key: keyof typeof base): Record<string, string> {
  const clone: Record<string, string> = { ...base };
  delete clone[key];
  return clone;
}

export const aberrationsNegativeCases: AberrationsNegativeCase[] = [
  {
    testName:
      "Missing organisationLookupId returns empty success grid (not 4xx)",
    params: omit("organisationLookupId"),
    outcome: "empty-success",
    expectedStatuses: [200],
    tags: ["@revenue-protection", "@aberrations", "@negative"],
  },
  {
    testName: "Missing month returns empty success grid (not 4xx)",
    params: omit("month"),
    outcome: "empty-success",
    expectedStatuses: [200],
    tags: ["@revenue-protection", "@aberrations", "@negative"],
  },
  {
    testName: "Missing year returns empty success grid (not 4xx)",
    params: omit("year"),
    outcome: "empty-success",
    expectedStatuses: [200],
    tags: ["@revenue-protection", "@aberrations", "@negative"],
  },
  {
    testName: "Non-numeric organisationLookupId is rejected",
    params: { ...base, organisationLookupId: "abc" },
    outcome: "hard-reject",
    expectedStatuses: [400, 422],
    tags: ["@revenue-protection", "@aberrations", "@negative"],
  },
  {
    testName: "Invalid month token returns empty success grid (not 4xx)",
    params: { ...base, month: "NOTAMONTH" },
    outcome: "empty-success",
    expectedStatuses: [200],
    tags: ["@revenue-protection", "@aberrations", "@negative"],
  },
  {
    testName: "Zero limit is rejected",
    params: { ...base, limit: "0" },
    outcome: "hard-reject",
    expectedStatuses: [400, 422],
    tags: ["@revenue-protection", "@aberrations", "@negative"],
  },
  {
    testName: "Negative page is rejected",
    params: { ...base, page: "-1" },
    outcome: "hard-reject",
    expectedStatuses: [400, 422],
    tags: ["@revenue-protection", "@aberrations", "@negative"],
  },
];
