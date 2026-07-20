import type { AberrationEntryType } from "../Mapper/aberration-entry.mapper";

type AberrationEntryNegativeCase = {
  testCaseId: string;
  testName: string;
  tags: readonly string[];
  entryType: AberrationEntryType;
  params: Record<string, string | number>;
  expectedStatuses: readonly number[];
  outcome: "hard-reject" | "empty-success" | "empty-page";
};

export const aberrationEntryEenltmtNegativeCases: AberrationEntryNegativeCase[] =
  [
    {
      testCaseId: "IND-REV-ABE-EEN-NEG-001",
      testName: "IND-REV-ABE-EEN-NEG-001 — Invalid month",
      tags: [
        "@revenue-protection",
        "@aberration-entry-eenltmt",
        "@negative",
      ],
      entryType: "eenltmt",
      params: {
        month: "InvalidMonth",
        year: 2026,
        page: 1,
        limit: 10,
      },
      expectedStatuses: [200, 400],
      outcome: "empty-success",
    },
    {
      testCaseId: "IND-REV-ABE-EEN-NEG-002",
      testName: "IND-REV-ABE-EEN-NEG-002 — Invalid year",
      tags: [
        "@revenue-protection",
        "@aberration-entry-eenltmt",
        "@negative",
      ],
      entryType: "eenltmt",
      params: {
        month: "April",
        year: -1,
        page: 1,
        limit: 10,
      },
      expectedStatuses: [200, 400],
      outcome: "empty-success",
    },
    {
      testCaseId: "IND-REV-ABE-EEN-NEG-003",
      testName: "IND-REV-ABE-EEN-NEG-003 — Invalid page",
      tags: [
        "@revenue-protection",
        "@aberration-entry-eenltmt",
        "@negative",
      ],
      entryType: "eenltmt",
      params: {
        page: -1,
        limit: 10,
      },
      expectedStatuses: [400],
      outcome: "hard-reject",
    },
    {
      testCaseId: "IND-REV-ABE-EEN-NEG-004",
      testName: "IND-REV-ABE-EEN-NEG-004 — Invalid limit",
      tags: [
        "@revenue-protection",
        "@aberration-entry-eenltmt",
        "@negative",
      ],
      entryType: "eenltmt",
      params: {
        page: 1,
        limit: -10,
      },
      expectedStatuses: [400],
      outcome: "hard-reject",
    },
    {
      testCaseId: "IND-REV-ABE-EEN-NEG-005",
      testName: "IND-REV-ABE-EEN-NEG-005 — Page beyond available data",
      tags: [
        "@revenue-protection",
        "@aberration-entry-eenltmt",
        "@negative",
      ],
      entryType: "eenltmt",
      params: {
        page: 9999,
        limit: 10,
      },
      expectedStatuses: [200],
      outcome: "empty-page",
    },
  ];
