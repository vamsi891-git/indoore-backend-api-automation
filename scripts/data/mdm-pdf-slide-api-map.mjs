/** Map MDM PDF slide titles → API endpoints (framework comparison). */

const MONTH = Number(process.env.MDM_COMPARE_MONTH ?? 12);
const YEAR = Number(process.env.MDM_COMPARE_YEAR ?? 2025);
const FROM_DATE = process.env.MDM_COMPARE_FROM_DATE ?? "2025-12-20";
const TO_DATE = process.env.MDM_COMPARE_TO_DATE ?? "2025-12-20";

export const DEFAULT_QUERY = { month: MONTH, year: YEAR, page: 1, pageSize: 20, limit: 20 };

function norm(s) {
  return (s ?? "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/[^\w\s%-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** @type {{ test: (title: string, page: number) => boolean, config: object }[]} */
const RULES = [
  {
    test: (t) => /static overview|overall overview|mdm home/i.test(t),
    config: {
      module: "DASHBOARD",
      endpoint: "/indore/dashboard/metrics",
      params: {},
      tableType: "kpi",
    },
  },
  {
    test: (t) => /consumer master/i.test(t),
    config: {
      module: "MASTER-DATA",
      endpoint: "/indore/master-data/consumer-master-data",
      params: { page: 1, limit: 20 },
    },
  },
  {
    test: (t) => /dtr overview detail|dtr overview/i.test(t) && !/event|hourly|daily|communication|ip|ls|dp/i.test(t),
    config: {
      module: "DTRS",
      endpoint: "/indore/master-data/dtr-master-data",
      params: { page: 1, limit: 20 },
    },
  },
  {
    test: (t) => /meter command|billing exchange/i.test(t),
    config: {
      module: "HES-COMMANDS",
      endpoint: "/commands/history",
      params: { page: 1, limit: 20 },
      optional: true,
      note: "Billing Exchange has no mapped /indore endpoint; HES history shown as proxy",
    },
  },
  {
    test: (t) => /mobile notification/i.test(t),
    config: {
      module: "NOTIFICATIONS",
      endpoint: "/indore/notifications",
      params: { page: 1, limit: 20 },
    },
  },
  {
    test: (t) => /network loss analysis.*billing/i.test(t),
    config: {
      module: "ENERGY-AUDITS",
      endpoint: "/indore/energy-audit/loss-analysis",
      params: {
        "report-type": "billing",
        month: MONTH,
        year: YEAR,
        fromDate: FROM_DATE,
        toDate: TO_DATE,
        networkType: "dtr",
        networkLookupId: Number(process.env.ENERGY_AUDIT_DTR_NETWORK_LOOKUP_ID ?? 5),
        page: 1,
        limit: 20,
      },
    },
  },
  {
    test: (t) => /hourly loss report/i.test(t),
    config: {
      module: "ENERGY-AUDITS",
      endpoint: "/indore/energy-audit/hourly-loss-report",
      params: {
        month: MONTH,
        year: YEAR,
        fromDate: FROM_DATE,
        toDate: TO_DATE,
        networkType: "dtr",
        networkLookupId: Number(process.env.ENERGY_AUDIT_DTR_NETWORK_LOOKUP_ID ?? 5),
        page: 1,
        limit: 20,
      },
    },
  },
  {
    test: (t) => /mis dashboard/i.test(t) && !/report|download/i.test(t),
    config: {
      module: "MIS-DASHBOARD",
      endpoint: "/indore/mis-dashboard/communication",
      params: { fromDate: "2026-04-01", toDate: "2026-04-30" },
    },
  },
  {
    test: (t) => /communication dashboard monthly|communication dashboard$/i.test(t),
    config: {
      module: "MIS-DASHBOARD",
      endpoint: "/indore/mis-dashboard/communication-stats",
      params: { fromDate: "2026-04-01", toDate: "2026-04-30" },
    },
  },
  {
    test: (t) => /live communication/i.test(t),
    config: {
      module: "MIS-DASHBOARD",
      endpoint: "/indore/mis-dashboard/communication-stats",
      params: { fromDate: FROM_DATE, toDate: TO_DATE },
      note: "Live dashboard uses communication-stats with recent date window",
    },
  },
  {
    test: (t) => /event data phase|event data voltage|event data current|event data power/i.test(t),
    config: {
      module: "MIS-DASHBOARD",
      endpoint: "/indore/mis-dashboard/event-data/voltage",
      params: { reportType: "phase-wise", period: "daily" },
    },
  },
  {
    test: (t) => /event data category/i.test(t),
    config: {
      module: "MIS-DASHBOARD",
      endpoint: "/indore/mis-dashboard/event-data/voltage",
      params: { reportType: "category-wise", period: "daily" },
    },
  },
  {
    test: (t) => /event data priority|priority wise/i.test(t),
    config: {
      module: "MIS-DASHBOARD",
      endpoint: "/indore/mis-dashboard/event-priority-overview",
      params: { fromDate: FROM_DATE, toDate: TO_DATE },
    },
  },
  {
    test: (t) => /no restoration|non rollover/i.test(t),
    config: {
      module: "MIS-DASHBOARD",
      endpoint: "/indore/mis-dashboard/event-data/non-rollover",
      params: { fromDate: FROM_DATE, toDate: TO_DATE, page: 1, limit: 20 },
    },
  },
  {
    test: (t) => /^commercial analysis$/i.test(t.trim()),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/summary",
      params: { month: MONTH, year: YEAR, pfThreshold: 0.8 },
      tableType: "summary",
    },
  },
  {
    test: (t) => /pf violation/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/pf",
      params: { month: MONTH, year: YEAR, threshold: 0.8, page: 1, pageSize: 20 },
      summaryKey: "pf_violation",
    },
  },
  {
    test: (t) => /md.*cd.*three/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/md",
      params: { month: MONTH, year: YEAR, type: "MD > CD Last Three Month", months: 3, page: 1, pageSize: 20 },
      summaryKey: "md_gt_cd_last_three_months",
    },
  },
  {
    test: (t) => /sanction load/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/md",
      params: { month: MONTH, year: YEAR, type: "Sanction Load Violation", months: 3, page: 1, pageSize: 20 },
      summaryKey: "sanction_load_violation",
    },
  },
  {
    test: (t) => /lf.*100/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/lf",
      params: { month: MONTH, year: YEAR, threshold: 100, operator: "gt", months: 1, page: 1, pageSize: 20 },
      summaryKey: "lf_gt_100",
    },
  },
  {
    test: (t) => /lf.*5.*three/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/lf",
      params: { month: MONTH, year: YEAR, threshold: 5, operator: "lt", months: 3, page: 1, pageSize: 20 },
      summaryKey: "lf_lt_5_last_3m",
    },
  },
  {
    test: (t) => /lf.*5.*six/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/lf",
      params: { month: MONTH, year: YEAR, threshold: 5, operator: "lt", months: 6, page: 1, pageSize: 20 },
      summaryKey: "lf_lt_5_last_6m",
    },
  },
  {
    test: (t) => /lf.*5/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/lf",
      params: { month: MONTH, year: YEAR, threshold: 5, operator: "lt", months: 1, page: 1, pageSize: 20 },
      summaryKey: "lf_lt_5",
    },
  },
  {
    test: (t) => /consumption compare last month/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/consumption-compare",
      params: { month: MONTH, year: YEAR, type: "Consumption Compare Last Month", page: 1, pageSize: 20 },
      summaryKey: "consumption_compare_prev_month",
    },
  },
  {
    test: (t) => /consumption compare same month/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/consumption-compare",
      params: { month: MONTH, year: YEAR, type: "Consumption Compare Same Month Last Year", page: 1, pageSize: 20 },
      summaryKey: "consumption_compare_same_month_last_year",
    },
  },
  {
    test: (t) => /abnormal low/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/consumption-compare",
      params: { month: MONTH, year: YEAR, type: "Abnormal Low Consumption", page: 1, pageSize: 20 },
      summaryKey: "abnormal_low",
    },
  },
  {
    test: (t) => /zero consumption for last 3|zero consumption.*3 month/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/consumption-pattern",
      params: { month: MONTH, year: YEAR, pattern: "zero", months: 3, threshold: 100, page: 1, pageSize: 20 },
      summaryKey: "zero_consumption_3m",
    },
  },
  {
    test: (t) => /zero consumption for last 6/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/consumption-pattern",
      params: { month: MONTH, year: YEAR, pattern: "zero", months: 6, threshold: 100, page: 1, pageSize: 20 },
      summaryKey: "zero_consumption_6m",
    },
  },
  {
    test: (t) => /zero consumption for last 9/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/consumption-pattern",
      params: { month: MONTH, year: YEAR, pattern: "zero", months: 9, threshold: 100, page: 1, pageSize: 20 },
      summaryKey: "zero_consumption_9m",
    },
  },
  {
    test: (t) => /zero consumption for last 12/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/consumption-pattern",
      params: { month: MONTH, year: YEAR, pattern: "zero", months: 12, threshold: 100, page: 1, pageSize: 20 },
      summaryKey: "zero_consumption_12m",
    },
  },
  {
    test: (t) => /zero consumption more than|zero consumption$/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/consumption-pattern",
      params: { month: MONTH, year: YEAR, pattern: "zero", months: 1, threshold: 100, page: 1, pageSize: 20 },
      summaryKey: "zero_consumption_1m",
    },
  },
  {
    test: (t) => /100-unit.*three|100 unit.*three/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/consumption-pattern",
      params: { month: MONTH, year: YEAR, pattern: "low", months: 3, threshold: 100, page: 1, pageSize: 20 },
      summaryKey: "low_consumption_100_units_3m",
    },
  },
  {
    test: (t) => /100-unit.*six|100 unit.*six/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/consumption-pattern",
      params: { month: MONTH, year: YEAR, pattern: "low", months: 6, threshold: 100, page: 1, pageSize: 20 },
      summaryKey: "low_consumption_100_units_6m",
    },
  },
  {
    test: (t) => /100-unit.*nine|100 unit.*nine/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/consumption-pattern",
      params: { month: MONTH, year: YEAR, pattern: "low", months: 9, threshold: 100, page: 1, pageSize: 20 },
      summaryKey: "low_consumption_100_units_9m",
    },
  },
  {
    test: (t) => /50.*avg.*initial|avg consumption.*initial/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/summary",
      params: { month: MONTH, year: YEAR, pfThreshold: 0.8 },
      summaryKey: "avg_less_than_initial_6m",
      tableType: "summary-row-only",
    },
  },
  {
    test: (t) => /night zero consumption/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/summary",
      params: { month: MONTH, year: YEAR, pfThreshold: 0.8 },
      summaryKey: "night_zero_consumption",
      tableType: "summary-row-only",
    },
  },
  {
    test: (t) => /night consumption.*10.*day/i.test(t),
    config: {
      module: "COMMERICIAL-ANALYSIS",
      endpoint: "/indore/analysis/commercial/summary",
      params: { month: MONTH, year: YEAR, pfThreshold: 0.8 },
      summaryKey: "night_lte_threshold",
      tableType: "summary-row-only",
    },
  },
  {
    test: (t) => /technical analysis/i.test(t) && !/techno commercial/i.test(t),
    config: {
      module: "TECHNICAL-ANALYSIS",
      endpoint: "/indore/analysis/technical/report",
      params: { analysisType: "total", month: MONTH, year: YEAR, category: "total", pageSize: 20 },
    },
  },
  {
    test: (t) => /mis report/i.test(t),
    config: {
      module: "REPORTS",
      endpoint: "/indore/reports/event-report",
      params: { fromDate: FROM_DATE, toDate: TO_DATE, organisationLookupId: 1, limit: 20 },
    },
  },
  {
    test: (t) => /communication.*consumer detail|communication.*ip data|communication.*dp data|communication.*ls data/i.test(t),
    config: {
      module: "MIS-DASHBOARD",
      endpoint: "/indore/mis-dashboard/communication",
      params: { fromDate: FROM_DATE, toDate: TO_DATE },
    },
  },
  {
    test: (t) => /consumer event detail/i.test(t),
    config: {
      module: "REPORTS",
      endpoint: "/indore/reports/event-detail",
      params: { fromDate: FROM_DATE, toDate: TO_DATE, page: 1, limit: 20 },
    },
  },
  {
    test: (t) => /consumer event/i.test(t) && !/detail|data|no restoration/i.test(t),
    config: {
      module: "REPORTS",
      endpoint: "/indore/reports/event-report",
      params: { fromDate: FROM_DATE, toDate: TO_DATE, organisationLookupId: 1, limit: 20 },
    },
  },
  {
    test: (t) => /dtr communication/i.test(t),
    config: {
      module: "DASHBOARD",
      endpoint: "/indore/dashboard/dtr-communication",
      params: {},
    },
  },
  {
    test: (t) => /dtr event|dtr interruption/i.test(t),
    config: {
      module: "DTRS",
      endpoint: "/indore/master-data/dtr-master-data",
      params: { page: 1, limit: 5 },
      note: "DTR events need dtrCode; master list used for table structure compare",
    },
  },
  {
    test: (t) => /dtr hourly load|dtr daily analysis/i.test(t),
    config: {
      module: "DTRS",
      endpoint: "/indore/master-data/dtr-master-data",
      params: { page: 1, limit: 20 },
    },
  },
  {
    test: (t) => /consumer consumption hourly/i.test(t),
    config: {
      module: "CONSUMPTION",
      endpoint: "/indore/consumption/report",
      params: { reportType: "hourly", page: 1, limit: 20, fromDate: FROM_DATE, toDate: TO_DATE, month: MONTH, year: YEAR },
    },
  },
  {
    test: (t) => /consumer consumption daily/i.test(t),
    config: {
      module: "CONSUMPTION",
      endpoint: "/indore/consumption/report",
      params: { reportType: "daily", page: 1, limit: 20, fromDate: FROM_DATE, toDate: TO_DATE, month: MONTH, year: YEAR },
    },
  },
  {
    test: (t) => /consumer consumption monthly/i.test(t),
    config: {
      module: "CONSUMPTION",
      endpoint: "/indore/consumption/report",
      params: { reportType: "monthly", page: 1, limit: 20, fromDate: FROM_DATE, toDate: TO_DATE, month: MONTH, year: YEAR },
    },
  },
  {
    test: (t) => /night zero consumption.*00:00|consumer night zero/i.test(t),
    config: {
      module: "CONSUMPTION",
      endpoint: "/indore/consumption/report",
      params: { reportType: "daily", page: 1, limit: 20, fromDate: FROM_DATE, toDate: TO_DATE, month: MONTH, year: YEAR },
      note: "Night zero may use dedicated rule; daily report used for structure",
    },
  },
  {
    test: (t) => /monthly net meter/i.test(t),
    config: {
      module: "CONSUMPTION",
      endpoint: "/indore/consumption/monthly-net-meter",
      params: { month: MONTH, year: YEAR, page: 1, limit: 20 },
    },
  },
  {
    test: (t) => /day wise billing|daywise billing/i.test(t),
    config: {
      module: "BILLING",
      endpoint: "/indore/billing/daywise-billing-data",
      params: { month: MONTH, year: YEAR, includeTotal: true, page: 1, limit: 20 },
    },
  },
  {
    test: (t) => /monthly billing/i.test(t),
    config: {
      module: "BILLING",
      endpoint: "/indore/billing/billing-data",
      params: { month: MONTH, year: YEAR, page: 1, limit: 20 },
    },
  },
  {
    test: (t) => /last three month/i.test(t) && /pattern/i.test(t),
    config: {
      module: "CONSUMPTION",
      endpoint: "/indore/consumption/pattern-consumption",
      params: { patternType: "lastThreeMonths", page: 1, limit: 20, month: MONTH, year: YEAR },
    },
  },
  {
    test: (t) => /yearly consumption/i.test(t),
    config: {
      module: "CONSUMPTION",
      endpoint: "/indore/consumption/pattern-consumption",
      params: { patternType: "yearly", page: 1, limit: 20, month: MONTH, year: YEAR },
    },
  },
  {
    test: (t) => /consumption comparison/i.test(t),
    config: {
      module: "CONSUMPTION",
      endpoint: "/indore/consumption/pattern-consumption",
      params: { patternType: "comparison", page: 1, limit: 20, month: MONTH, year: YEAR },
    },
  },
  {
    test: (t) => /prepaid summary/i.test(t),
    config: {
      module: "HES-COMMANDS",
      endpoint: "/commands/meters/" + (process.env.VALID_METER_SERIAL ?? "PROBE"),
      params: {},
      optional: true,
      note: "Prepaid summary UI; meter lookup proxy when VALID_METER_SERIAL set",
    },
  },
  {
    test: (t) => /dtr ip data/i.test(t),
    config: {
      module: "ENERGY-AUDITS",
      endpoint: "/indore/energy-audit/loss-analysis",
      params: {
        "report-type": "billing",
        month: MONTH,
        year: YEAR,
        fromDate: FROM_DATE,
        toDate: TO_DATE,
        networkType: "dtr",
        networkLookupId: Number(process.env.ENERGY_AUDIT_DTR_NETWORK_LOOKUP_ID ?? 5),
        page: 1,
        limit: 20,
      },
      note: "IP data slide mapped to loss-analysis billing view",
    },
  },
  {
    test: (t) => /dtr ls data/i.test(t),
    config: {
      module: "ENERGY-AUDITS",
      endpoint: "/indore/energy-audit/loss-analysis",
      params: {
        "report-type": "ls",
        month: MONTH,
        year: YEAR,
        fromDate: FROM_DATE,
        toDate: TO_DATE,
        networkType: "dtr",
        networkLookupId: Number(process.env.ENERGY_AUDIT_DTR_NETWORK_LOOKUP_ID ?? 5),
        page: 1,
        limit: 20,
      },
    },
  },
  {
    test: (t) => /dtr dp data/i.test(t),
    config: {
      module: "ENERGY-AUDITS",
      endpoint: "/indore/energy-audit/loss-analysis",
      params: {
        "report-type": "dp",
        month: MONTH,
        year: YEAR,
        fromDate: FROM_DATE,
        toDate: TO_DATE,
        networkType: "dtr",
        networkLookupId: Number(process.env.ENERGY_AUDIT_DTR_NETWORK_LOOKUP_ID ?? 5),
        page: 1,
        limit: 20,
      },
    },
  },
  {
    test: (t) => /min and max voltage|power quality|current without voltage/i.test(t),
    config: {
      module: "CONSUMERS",
      endpoint: "/indore/consumers/power-quality",
      params: { consumerCid: process.env.MDM_COMPARE_CONSUMER_CID ?? "PROBE", month: MONTH, year: YEAR },
      optional: true,
      note: "Set MDM_COMPARE_CONSUMER_CID for live consumer compare",
    },
  },
];

export function resolveSlideApi(title, page) {
  const n = norm(title);
  if (!n || n.startsWith("blank page")) return null;
  for (const rule of RULES) {
    if (rule.test(n, page)) {
      return { ...rule.config, slideTitle: title, slidePage: page };
    }
  }
  return null;
}

export function parsePdfSlides(extractText) {
  const slides = [];
  const parts = extractText.split(/-- (\d+) of 131 --/);
  for (let i = 1; i < parts.length; i += 2) {
    const page = Number(parts[i]);
    const body = parts[i + 1]?.trim() ?? "";
    const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
    const title = lines[0] ?? `(blank page ${page})`;
    slides.push({ page, title, isBlank: lines.length === 0 });
  }
  return slides;
}
