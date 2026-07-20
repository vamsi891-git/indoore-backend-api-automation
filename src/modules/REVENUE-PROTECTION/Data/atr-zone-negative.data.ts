import { atrZoneDefaultQuery } from "./atr-zone.data";

export type AtrZoneNegativeOutcome = "hard-reject" | "empty-success" | "empty-page";

export interface AtrZoneNegativeCase {
  testCaseId: string;
  testName: string;
  params: Record<string, string>;
  outcome: AtrZoneNegativeOutcome;
  expectedStatuses: number[];
  tags: string[];
}

const base = {
  year: String(atrZoneDefaultQuery.year),
  page: "1",
  limit: "10",
};

export const atrZoneNegativeCases: AtrZoneNegativeCase[] = [
  {
    testCaseId: "IND-RPT-ATZ-NEG-001",
    testName: "IND-RPT-ATZ-NEG-001 — Invalid year format",
    params: { ...base, year: "20XX" },
    outcome: "empty-success",
    expectedStatuses: [200],
    tags: ["@revenue-protection", "@atr-zone", "@negative"],
  },
  {
    testCaseId: "IND-RPT-ATZ-NEG-002",
    testName: "IND-RPT-ATZ-NEG-002 — SQL injection in year filter",
    params: { ...base, year: "2026 OR 1=1" },
    outcome: "hard-reject",
    expectedStatuses: [400, 422],
    tags: ["@revenue-protection", "@atr-zone", "@negative"],
  },
  {
    testCaseId: "IND-RPT-ATZ-NEG-003",
    testName: "IND-RPT-ATZ-NEG-003 — NoSQL-style injection in year",
    params: { ...base, year: '{"$gt":""}' },
    outcome: "empty-success",
    expectedStatuses: [200, 400, 422],
    tags: ["@revenue-protection", "@atr-zone", "@negative"],
  },
  {
    testCaseId: "IND-RPT-ATZ-NEG-004",
    testName: "IND-RPT-ATZ-NEG-004 — page=0 is rejected",
    params: { ...base, page: "0" },
    outcome: "hard-reject",
    expectedStatuses: [400, 422],
    tags: ["@revenue-protection", "@atr-zone", "@negative"],
  },
  {
    testCaseId: "IND-RPT-ATZ-NEG-005",
    testName: "IND-RPT-ATZ-NEG-005 — page=-1 is rejected",
    params: { ...base, page: "-1" },
    outcome: "hard-reject",
    expectedStatuses: [400, 422],
    tags: ["@revenue-protection", "@atr-zone", "@negative"],
  },
  {
    testCaseId: "IND-RPT-ATZ-NEG-006",
    testName: "IND-RPT-ATZ-NEG-006 — limit=0 is rejected",
    params: { ...base, limit: "0" },
    outcome: "hard-reject",
    expectedStatuses: [400, 422],
    tags: ["@revenue-protection", "@atr-zone", "@negative"],
  },
  {
    testCaseId: "IND-RPT-ATZ-NEG-007",
    testName: "IND-RPT-ATZ-NEG-007 — limit=99999 is rejected or bounded",
    params: { ...base, limit: "99999" },
    outcome: "hard-reject",
    expectedStatuses: [400, 422],
    tags: ["@revenue-protection", "@atr-zone", "@negative"],
  },
  {
    testCaseId: "IND-RPT-ATZ-NEG-008",
    testName: "IND-RPT-ATZ-NEG-008 — Far-future year returns empty success grid",
    params: { ...base, year: "2099" },
    outcome: "empty-success",
    expectedStatuses: [200],
    tags: ["@revenue-protection", "@atr-zone", "@negative"],
  },
  {
    testCaseId: "IND-RPT-ATZ-NEG-009",
    testName: "IND-RPT-ATZ-NEG-009 — page beyond totalPages returns empty rows (not error)",
    params: { ...base, page: "9999" },
    outcome: "empty-page",
    expectedStatuses: [200],
    tags: ["@revenue-protection", "@atr-zone", "@negative"],
  },
];