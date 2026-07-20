export const aberrationEntryNegativeCases = [
  {
    testCaseId: "IND-REV-ABE-ENTRY-NEG-001",

    testName:
      "IND-REV-ABE-ENTRY-NEG-001 — Invalid month",

    tags: [
      "@revenue-protection",
      "@aberration-entry",
      "@negative",
    ],

    entryType: "zone" as const,

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
    testCaseId: "IND-REV-ABE-ENTRY-NEG-002",

    testName:
      "IND-REV-ABE-ENTRY-NEG-002 — Invalid year",

    tags: [
      "@revenue-protection",
      "@aberration-entry",
      "@negative",
    ],

    entryType: "zone" as const,

    params: {
      month: "January",
      year: -1,
      page: 1,
      limit: 10,
    },

    expectedStatuses: [200, 400],

    outcome: "empty-success",
  },

  {
    testCaseId: "IND-REV-ABE-ENTRY-NEG-003",

    testName:
      "IND-REV-ABE-ENTRY-NEG-003 — Invalid page",

    tags: [
      "@revenue-protection",
      "@aberration-entry",
      "@negative",
    ],

    entryType: "zone" as const,

    params: {
      month: "January",
      year: 2026,
      page: -1,
      limit: 10,
    },

    expectedStatuses: [400],

    outcome: "hard-reject",
  },

  {
    testCaseId: "IND-REV-ABE-ENTRY-NEG-004",

    testName:
      "IND-REV-ABE-ENTRY-NEG-004 — Invalid limit",

    tags: [
      "@revenue-protection",
      "@aberration-entry",
      "@negative",
    ],

    entryType: "zone" as const,

    params: {
      month: "January",
      year: 2026,
      page: 1,
      limit: -10,
    },

    expectedStatuses: [400],

    outcome: "hard-reject",
  },

  {
    testCaseId: "IND-REV-ABE-ENTRY-NEG-005",

    testName:
      "IND-REV-ABE-ENTRY-NEG-005 — Page beyond available data",

    tags: [
      "@revenue-protection",
      "@aberration-entry",
      "@negative",
    ],

    entryType: "zone" as const,

    params: {
      month: "January",
      year: 2026,
      page: 9999,
      limit: 10,
    },

    expectedStatuses: [200],

    outcome: "empty-page",
  },
] as const;