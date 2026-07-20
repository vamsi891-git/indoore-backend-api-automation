import { casesDefaultQuery } from "./cases.data";

export type CasesNegativeOutcome =
  | "hard-reject"
  | "empty-success"
  | "empty-page";

export interface CasesNegativeCase {
  testCaseId: string;
  testName: string;
  params: Record<string, string>;
  outcome: CasesNegativeOutcome;
  expectedStatuses: number[];
  tags: string[];
}

const base = {
  month: String(casesDefaultQuery.month),
  year: String(casesDefaultQuery.year),
  page: "1",
  limit: "10",
};

export const casesNegativeCases: CasesNegativeCase[] = [
  {
    testCaseId: "IND-RPT-NEG-001",
    testName: "IND-RPT-NEG-001 — Invalid year format",
    params: { ...base, year: "20XX" },
    outcome: "empty-success",
    expectedStatuses: [200],
    tags: ["@revenue-protection", "@cases", "@aberrations-detail", "@negative"],
  },
  {
    testCaseId: "IND-RPT-NEG-002",
    testName: "IND-RPT-NEG-002 — Invalid month format",
    params: { ...base, month: "13" },
    outcome: "empty-success",
    expectedStatuses: [200],
    tags: ["@revenue-protection", "@cases", "@aberrations-detail", "@negative"],
  },
  {
    testCaseId: "IND-RPT-NEG-003",
    testName: "IND-RPT-NEG-003 — Non-existent month token",
    params: { ...base, month: "NOTAMONTH" },
    outcome: "empty-success",
    expectedStatuses: [200],
    tags: ["@revenue-protection", "@cases", "@aberrations-detail", "@negative"],
  },
  {
    testCaseId: "IND-RPT-NEG-004",
    testName: "IND-RPT-NEG-004 — SQL injection in month filter",
    params: { ...base, month: "JAN'; DROP TABLE users;--" },
    outcome: "empty-success",
    expectedStatuses: [200, 400, 422],
    tags: ["@revenue-protection", "@cases", "@aberrations-detail", "@negative"],
  },
  {
    testCaseId: "IND-RPT-NEG-005",
    testName: "IND-RPT-NEG-005 — SQL injection in year filter",
    params: { ...base, year: "2026 OR 1=1" },
    outcome: "hard-reject",
    expectedStatuses: [400, 422],
    tags: ["@revenue-protection", "@cases", "@aberrations-detail", "@negative"],
  },
  {
    testCaseId: "IND-RPT-NEG-006",
    testName: "IND-RPT-NEG-006 — NoSQL-style injection in year",
    params: { ...base, year: '{"$gt":""}' },
    outcome: "empty-success",
    expectedStatuses: [200, 400, 422],
    tags: ["@revenue-protection", "@cases", "@aberrations-detail", "@negative"],
  },
  {
    testCaseId: "IND-RPT-NEG-007",
    testName: "IND-RPT-NEG-007 — page=0 is rejected",
    params: { ...base, page: "0" },
    outcome: "hard-reject",
    expectedStatuses: [400, 422],
    tags: ["@revenue-protection", "@cases", "@aberrations-detail", "@negative"],
  },
  {
    testCaseId: "IND-RPT-NEG-008",
    testName: "IND-RPT-NEG-008 — page=-1 is rejected",
    params: { ...base, page: "-1" },
    outcome: "hard-reject",
    expectedStatuses: [400, 422],
    tags: ["@revenue-protection", "@cases", "@aberrations-detail", "@negative"],
  },
  {
    testCaseId: "IND-RPT-NEG-009",
    testName: "IND-RPT-NEG-009 — limit=0 is rejected",
    params: { ...base, limit: "0" },
    outcome: "hard-reject",
    expectedStatuses: [400, 422],
    tags: ["@revenue-protection", "@cases", "@aberrations-detail", "@negative"],
  },
  {
    testCaseId: "IND-RPT-NEG-010",
    testName: "IND-RPT-NEG-010 — limit=99999 is rejected or bounded",
    params: { ...base, limit: "99999" },
    outcome: "hard-reject",
    expectedStatuses: [400, 422],
    tags: ["@revenue-protection", "@cases", "@aberrations-detail", "@negative"],
  },
  {
    testCaseId: "IND-RPT-NEG-015",
    testName:
      "IND-RPT-NEG-015 — Far-future filter returns empty success grid",
    params: { ...base, month: "DEC", year: "2099" },
    outcome: "empty-success",
    expectedStatuses: [200],
    tags: ["@revenue-protection", "@cases", "@aberrations-detail", "@negative"],
  },
  {
    testCaseId: "IND-RPT-NEG-016",
    testName:
      "IND-RPT-NEG-016 — page beyond totalPages returns empty rows (not error)",
    params: { ...base, page: "9999" },
    outcome: "empty-page",
    expectedStatuses: [200],
    tags: ["@revenue-protection", "@cases", "@aberrations-detail", "@negative"],
  },
];
