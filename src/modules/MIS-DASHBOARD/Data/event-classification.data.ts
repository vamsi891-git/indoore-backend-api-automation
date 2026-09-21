export const eventClassificationQuery = {
  reportType: "phase-wise",
  assetType: "all",
};

export const backendRules = {
  reportTypes: ["phase-wise", "category-wise"],
  expectedCategories: [
    "voltage",
    "current",
    "power",
    "transaction",
    "other",
    "non-rollover-control",
  ],
};

export const labelMappings = {
  voltage: "Voltage",
  current: "Current",
  power: "Power",
  transaction: "Transaction",
  other: "Others",
  "non-rollover-control": "NonRollover",
};

export type EventClassificationTestCase = {
  testName: string;
  params: Record<string, string | number | boolean>;
  expectedStatus: 200 | 400;
  expectedReportType?: "phase-wise" | "category-wise";
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
};

const tags = ["@mis-dashboard", "@classification", "@edge"];
const smoke = ["@smoke", "@classification", "@mis-dashboard"];

function groupingWords(reportType: string): string {
  return reportType === "phase-wise" ? "by meter type" : "by consumer category";
}

function happyCases(
  reportType: "phase-wise" | "category-wise",
  isSmoke: boolean,
): EventClassificationTestCase[] {
  const group = groupingWords(reportType);
  return [
    {
      testName: `What kinds of events happened — ${group}, all meters`,
      params: { reportType, assetType: "all" },
      expectedStatus: 200,
      expectedReportType: reportType,
      tags: isSmoke ? smoke : tags,
    },
    {
      testName: `What kinds of events happened — ${group}, consumer meters only`,
      params: { reportType, assetType: "consumer" },
      expectedStatus: 200,
      expectedReportType: reportType,
      tags,
    },
    {
      testName: `What kinds of events happened — ${group}, DTR meters only`,
      params: { reportType, assetType: "dtr" },
      expectedStatus: 200,
      expectedReportType: reportType,
      tags,
    },
    {
      testName: `What kinds of events happened — ${group}, both is treated as all meters`,
      params: { reportType, assetType: "both" },
      expectedStatus: 200,
      expectedReportType: reportType,
      tags,
    },
    {
      testName: `What kinds of events happened — ${group}, consumers is treated as consumer meters`,
      params: { reportType, assetType: "consumers" },
      expectedStatus: 200,
      expectedReportType: reportType,
      tags,
    },
    {
      testName: `What kinds of events happened — ${group}, dtrs is treated as DTR meters`,
      params: { reportType, assetType: "dtrs" },
      expectedStatus: 200,
      expectedReportType: reportType,
      tags,
    },
    {
      testName: `What kinds of events happened — ${group}, unknown meter kind is treated as all`,
      params: { reportType, assetType: "transformers" },
      expectedStatus: 200,
      expectedReportType: reportType,
      tags,
    },
  ];
}

export const eventClassificationTestCases: EventClassificationTestCase[] = [
  ...happyCases("phase-wise", true),
  ...happyCases("category-wise", false),
  {
    testName: "What kinds of events happened — extra unused options are ignored",
    params: { reportType: "phase-wise", assetType: "all", foo: "1" },
    expectedStatus: 200,
    expectedReportType: "phase-wise",
    tags,
  },
  {
    testName: "What kinds of events happened — report_type still works",
    params: { report_type: "category-wise", assetType: "all" },
    expectedStatus: 200,
    expectedReportType: "category-wise",
    tags,
  },
  {
    testName: "What kinds of events happened — a missing grouping is rejected",
    params: { assetType: "all" },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "What kinds of events happened — an invalid grouping is rejected",
    params: { reportType: "not-a-type", assetType: "all" },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "What kinds of events happened — a blank grouping is rejected",
    params: { reportType: " ", assetType: "all" },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "What kinds of events happened — organisation 0 is rejected",
    params: { reportType: "phase-wise", organisationLookupId: 0 },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "What kinds of events happened — a negative organisation is rejected",
    params: { reportType: "phase-wise", organisationLookupId: -1 },
    expectedStatus: 400,
    tags,
  },
  {
    testName: "What kinds of events happened — network 0 is rejected",
    params: { reportType: "phase-wise", networkLookupId: 0 },
    expectedStatus: 400,
    tags,
  },
];
