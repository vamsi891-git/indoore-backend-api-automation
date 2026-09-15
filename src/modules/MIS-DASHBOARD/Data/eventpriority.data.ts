import { misPeriodWords } from "./mis-dashboard-titles.data";

export const eventPriorityLevels = [1, 2, 3, 4, 5, 6] as const;

export const eventPriorityQuery = {
  period: "daily",
  assetType: "all",
};

export const eventPriorityPath = "Priority1";

export function eventPrioritySlug(level: number): string {
  return `Priority${level}`;
}

export function eventPriorityLabel(level: number): string {
  return `Priority ${level}`;
}

export function eventPriorityTitle(level: number): string {
  return `Urgency level ${level} events`;
}

export const backendRules = {
  periods: ["hourly", "daily", "weekly", "monthly"],
  phaseLabels: ["1 PH", "3PH 4CT", "3PH WC", "HT"],
  trendRegex: {
    hourly: /^\d{2}:\d{2}$/,
    daily: /^\d{4}-\d{2}-\d{2}$/,
    weekly: /^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/,
    monthly: /^\d{4}-\d{2}$/,
  },
};

export type EventPriorityTestCase = {
  testName: string;
  priority: string;
  params: Record<string, string | number | boolean>;
  expectedStatus: 200 | 400;
  expectedPeriod?: string;
  expectedPriorityId?: number;
  expectedLabel?: string;
  tags: string[];
};

const tags = ["@mis-dashboard", "@event-data", "@edge"];
const smoke = ["@smoke", "@event-data", "@mis-dashboard"];
const periods = ["hourly", "daily", "weekly", "monthly"] as const;
const assets = [
  { assetType: "all", words: "all meters" },
  { assetType: "consumer", words: "consumer meters only" },
  { assetType: "dtr", words: "DTR meters only" },
] as const;

function casesForLevel(level: number): EventPriorityTestCase[] {
  const title = eventPriorityTitle(level);
  const priority = eventPrioritySlug(level);
  const expectedPriorityId = level;
  const expectedLabel = eventPriorityLabel(level);
  const cases: EventPriorityTestCase[] = [];

  for (const period of periods) {
    for (const asset of assets) {
      const isSmoke = period === "daily" && asset.assetType === "all";
      cases.push({
        testName: `${title} — ${misPeriodWords(period)}, ${asset.words}`,
        priority,
        params: { period, assetType: asset.assetType },
        expectedStatus: 200,
        expectedPeriod: period,
        expectedPriorityId,
        expectedLabel,
        tags: isSmoke ? smoke : tags,
      });
    }
  }

  cases.push(
    {
      testName: `${title} — both is treated as all meters`,
      priority,
      params: { period: "daily", assetType: "both" },
      expectedStatus: 200,
      expectedPeriod: "daily",
      expectedPriorityId,
      expectedLabel,
      tags,
    },
    {
      testName: `${title} — consumers is treated as consumer meters`,
      priority,
      params: { period: "daily", assetType: "consumers" },
      expectedStatus: 200,
      expectedPeriod: "daily",
      expectedPriorityId,
      expectedLabel,
      tags,
    },
    {
      testName: `${title} — dtrs is treated as DTR meters`,
      priority,
      params: { period: "daily", assetType: "dtrs" },
      expectedStatus: 200,
      expectedPeriod: "daily",
      expectedPriorityId,
      expectedLabel,
      tags,
    },
    {
      testName: `${title} — extra unused options are ignored`,
      priority,
      params: { period: "daily", assetType: "all", foo: "1" },
      expectedStatus: 200,
      expectedPeriod: "daily",
      expectedPriorityId,
      expectedLabel,
      tags,
    },
    {
      testName: `${title} — an invalid time range is rejected`,
      priority,
      params: { period: "invalid_period" },
      expectedStatus: 400,
      tags,
    },
    {
      testName: `${title} — a blank time range is rejected`,
      priority,
      params: { period: " " },
      expectedStatus: 400,
      tags,
    },
    {
      testName: `${title} — a missing time range falls back to day by day`,
      priority,
      params: { assetType: "all" },
      expectedStatus: 200,
      expectedPeriod: "daily",
      expectedPriorityId,
      expectedLabel,
      tags,
    },
    {
      testName: `${title} — organisation 0 is rejected`,
      priority,
      params: { period: "daily", organisationLookupId: 0 },
      expectedStatus: 400,
      tags,
    },
    {
      testName: `${title} — network 0 is rejected`,
      priority,
      params: { period: "daily", networkLookupId: 0 },
      expectedStatus: 400,
      tags,
    },
  );

  return cases;
}

export const eventPriorityTestCases: EventPriorityTestCase[] =
  eventPriorityLevels.flatMap((level) => casesForLevel(level));
