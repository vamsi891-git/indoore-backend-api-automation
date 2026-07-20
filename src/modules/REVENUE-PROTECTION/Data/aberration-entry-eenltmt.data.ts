import type { AberrationEntryQuery } from "../Mapper/aberration-entry.mapper";

export const aberrationEntryEenltmtDefaultQuery: AberrationEntryQuery = {
  entryType: "eenltmt",
  page: 1,
  limit: 10,
};

export const aberrationEntryEenltmtSmallPageQuery: AberrationEntryQuery = {
  entryType: "eenltmt",
  page: 1,
  limit: 5,
};

export const aberrationEntryEenltmtSecondPageQuery: AberrationEntryQuery = {
  entryType: "eenltmt",
  page: 2,
  limit: 2,
};

/** Far-future month/year unlikely to have EENLMT rows — empty-success probe. */
export const aberrationEntryEenltmtZeroRowsQuery: AberrationEntryQuery = {
  entryType: "eenltmt",
  month: "December",
  year: 2099,
  page: 1,
  limit: 10,
};

export const aberrationEntryEenltmtTestCases = [
  {
    testCaseId: "IND-REV-ABE-EEN-001",
    testName:
      "IND-REV-ABE-EEN-001 — Fetch EENLTMT Aberration Entry without optional filters",
    tags: [
      "@revenue-protection",
      "@aberration-entry-eenltmt",
      "@positive",
      "@smoke",
    ],
    query: {
      entryType: "eenltmt",
      page: 1,
      limit: 10,
    },
  },
  {
    testCaseId: "IND-REV-ABE-EEN-002",
    testName:
      "IND-REV-ABE-EEN-002 — Fetch EENLTMT Aberration Entry using month + year",
    tags: ["@revenue-protection", "@aberration-entry-eenltmt", "@positive"],
    query: {
      entryType: "eenltmt",
      month: "April",
      year: 2026,
      page: 1,
      limit: 10,
    },
  },
  {
    testCaseId: "IND-REV-ABE-EEN-003",
    testName:
      "IND-REV-ABE-EEN-003 — Fetch EENLTMT Aberration Entry using only year",
    tags: ["@revenue-protection", "@aberration-entry-eenltmt", "@positive"],
    query: {
      entryType: "eenltmt",
      year: 2026,
      page: 1,
      limit: 10,
    },
  },
  {
    testCaseId: "IND-REV-ABE-EEN-004",
    testName:
      "IND-REV-ABE-EEN-004 — Fetch EENLTMT Aberration Entry using only month",
    tags: ["@revenue-protection", "@aberration-entry-eenltmt", "@positive"],
    query: {
      entryType: "eenltmt",
      month: "March",
      page: 1,
      limit: 10,
    },
  },
  {
    testCaseId: "IND-REV-ABE-EEN-005",
    testName:
      "IND-REV-ABE-EEN-005 — Fetch EENLTMT Aberration Entry pagination (limit 5)",
    tags: ["@revenue-protection", "@aberration-entry-eenltmt", "@positive"],
    query: {
      entryType: "eenltmt",
      page: 1,
      limit: 5,
    },
  },
  {
    testCaseId: "IND-REV-ABE-EEN-006",
    testName:
      "IND-REV-ABE-EEN-006 — Fetch EENLTMT Aberration Entry pagination (page 2, limit 2)",
    tags: ["@revenue-protection", "@aberration-entry-eenltmt", "@positive"],
    query: {
      entryType: "eenltmt",
      page: 2,
      limit: 2,
    },
  },
] as const;
