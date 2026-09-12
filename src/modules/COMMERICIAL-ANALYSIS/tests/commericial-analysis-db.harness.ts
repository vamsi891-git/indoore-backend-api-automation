import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { isArchiveDbConfigured } from "../../../core/db/postgres.client";
import { CommercialSummaryApi } from "../Api/commercial-summary.api";
import { PowerFactorApi } from "../Api/powerfactor.api";
import { LFAnalysisApi } from "../Api/loadfactor.api";
import { MdAnalysisApi } from "../Api/mdanalysis.api";
import { ConsumptionCompareApi } from "../Api/consumptioncompare.api";
import { ConsumptionPatternApi } from "../Api/consumptionpattern.api";
import { DayNightApi } from "../Api/daynight.api";
import { commercialSummaryData } from "../Data/commercial-summary.data";
import { pfAnalysisQuery } from "../Data/powerfactor.data";
import { LF_VALIDATABLE_TYPES } from "../Data/loadfactor.api";
import { MD_ANALYSIS_TYPES, MD_CATEGORY_SPLIT_TYPES } from "../Data/mdanalysis.data";
import { consumptionCompareLastMonthData } from "../Data/consumptioncompare.data";
import {
  consumptionPatternData,
  consumptionPatternLow3mData,
  consumptionPatternZero3mData,
} from "../Data/consumptionpattern.data";
import {
  dayNightCountBase,
} from "../Data/daynight.data";
import { CommercialSummaryMapper } from "../Mapper/commercial-summary.mapper";
import type { CommercialSummaryReport } from "../Mapper/commercial-summary.mapper";
import { getCommercialPaginatedView } from "../Validator/commercial-analysis.shared";
import {
  compareCommercialApiEqualsSql,
  compareCommercialMeterSpotToDb,
} from "../Db/commericial-analysis-db-compare";
import {
  countCommercialLfLt5Reporting,
  getCommercialMeterByMsnAndDtr,
} from "../Db/commericial-analysis.db";
import { logCommericialAnalysisDataQualityFindings } from "../Db/commericial-analysis-db.validator";

const SUMMARY_TO_LF_TYPE: Record<string, string> = {
  lf_lt_5: "LF < 5%",
  lf_gt_100: "LF > 100%",
  lf_lt_5_last_3m: "LF < 5% Last Three month",
};

const SUMMARY_TO_MD_TYPE: Record<string, string> = {
  md_gt_cd_last_three_months: "MD > CD Last Three Month",
  sanction_load_violation: "Sanction Load Violation",
  improper_md: "Improper MD",
};

const SUMMARY_TO_DAY_NIGHT: Record<string, string> = {
  night_zero_consumption: "Night Zero Consumption",
  night_lte_threshold: "Night consumption <= 10% of Day consumption",
};

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function trimText(value: unknown): string {
  return String(value ?? "").trim();
}

/** Page uniqueness lives in API specs. Spot by MSN + DTR — lookupId is reused across DTRs. */
async function assertPageRowsAgainstMeterLookup(options: {
  db: pg.Pool;
  validation: ValidationEngine;
  label: string;
  responseBody: { data?: { rows?: unknown[] } };
}): Promise<void> {
  const { db, validation, label, responseBody } = options;
  const rawRows = Array.isArray(responseBody.data?.rows)
    ? responseBody.data.rows
    : [];
  for (const apiRow of rawRows.map((row) => asRecord(row))) {
    const msn = trimText(apiRow.msn);
    const dtr = trimText(apiRow.dtr);
    const lookupIdRaw =
      apiRow.meterLookupId == null ? NaN : Number(apiRow.meterLookupId);
    const lookupId =
      Number.isFinite(lookupIdRaw) && lookupIdRaw > 0 ? lookupIdRaw : null;
    if (!msn) continue;
    const dbMeter = await getCommercialMeterByMsnAndDtr(db, msn, dtr);
    validation.execute(
      `${label} ${msn} dtr=${dtr || "(blank)"} vs L_Meter_Lookup`,
      () => {
        expect(
          dbMeter,
          `DB meter row missing for msn=${msn} dtr=${dtr}`,
        ).toBeTruthy();
        compareCommercialMeterSpotToDb({
          api: {
            msn,
            name: trimText(apiRow.name),
            ivrsNumber: trimText(apiRow.ivrsNumber),
            phase: trimText(apiRow.phase),
            circle: trimText(apiRow.circle),
            division: trimText(apiRow.division),
            feeder: trimText(apiRow.feeder),
            dtr,
            tariff: trimText(apiRow.tariff),
            meterLookupId: lookupId,
          },
          dbRow: dbMeter!,
        });
      },
    );
  }
}

async function assertPfPageUniqueAndAgainstDb(options: {
  db: pg.Pool;
  validation: ValidationEngine;
  label: string;
  responseBody: { data?: { rows?: unknown[] } };
}): Promise<void> {
  await assertPageRowsAgainstMeterLookup({
    ...options,
    label: `PF ${options.label}`,
  });
}

async function assertLfPageUniqueAndAgainstDb(options: {
  db: pg.Pool;
  validation: ValidationEngine;
  label: string;
  responseBody: { data?: { rows?: unknown[] } };
}): Promise<void> {
  await assertPageRowsAgainstMeterLookup({
    ...options,
    label: `LF ${options.label}`,
  });
}

async function assertMdPageUniqueAndAgainstDb(options: {
  db: pg.Pool;
  validation: ValidationEngine;
  label: string;
  responseBody: { data?: { rows?: unknown[] } };
}): Promise<void> {
  await assertPageRowsAgainstMeterLookup({
    ...options,
    label: `MD ${options.label}`,
  });
}

async function assertComparePageUniqueAndAgainstDb(options: {
  db: pg.Pool;
  validation: ValidationEngine;
  label: string;
  responseBody: { data?: { rows?: unknown[] } };
}): Promise<void> {
  await assertPageRowsAgainstMeterLookup({
    ...options,
    label: `Compare ${options.label}`,
  });
}

async function assertDayNightPageUniqueAndAgainstDb(options: {
  db: pg.Pool;
  validation: ValidationEngine;
  label: string;
  responseBody: { data?: { rows?: unknown[] } };
}): Promise<void> {
  await assertPageRowsAgainstMeterLookup({
    ...options,
    label: `Day-night ${options.label}`,
  });
}

function reportMap(
  reports: CommercialSummaryReport[],
): Map<string, CommercialSummaryReport> {
  return new Map(reports.map((r) => [r.analysisType, r]));
}

function isAvailable(report: CommercialSummaryReport | undefined): boolean {
  return Boolean(report) && report!.available !== false;
}

function gridTotal(
  data: unknown,
  month: number,
  year: number,
): number {
  return getCommercialPaginatedView(data, {
    month,
    year,
    page: 1,
    pageSize: 10,
  }).totalCount;
}

/**
 * Commercial summary KPIs vs matching drilldown totals (exact).
 * LF < 5% also vs `commercialLfLt5SummarySql` on archive reporting facts.
 */
export async function runCommericialAnalysisDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
  archiveDb?: pg.Pool | null,
): Promise<void> {
  const validation = new ValidationEngine();
  const { month, year, pfThreshold } = commercialSummaryData;

  const summaryResult = await new CommercialSummaryApi(
    authenticatedApi,
  ).getCommercialSummary(month, year, pfThreshold);
  expect(summaryResult.rawResponse.status()).toBe(200);
  const summary = CommercialSummaryMapper.map(summaryResult.responseBody);
  expect(summary.success).toBe(true);
  await logCommericialAnalysisDataQualityFindings(
    "summary",
    summaryResult.responseBody.data as unknown as Record<string, unknown>,
  );
  const reports = reportMap(summary.reports);

  const pfApi = new PowerFactorApi(authenticatedApi);
  const pfBody = await pfApi.getPfAnalysis({
    month,
    year,
    threshold: pfAnalysisQuery.threshold,
    page: 1,
    pageSize: 30,
  });
  expect(pfBody.rawResponse.status()).toBe(200);
  const pfData = asRecord(pfBody.responseBody.data);
  await logCommericialAnalysisDataQualityFindings("pf", pfData);
  const pfTotal = gridTotal(pfData, month, year);
  const pfSummary = reports.get("pf_violation");
  await assertPfPageUniqueAndAgainstDb({
    db,
    validation,
    label: "unfiltered",
    responseBody: pfBody.responseBody,
  });
  if (isAvailable(pfSummary)) {
    validation.execute("pf drilldown === summary.pf_violation", () => {
      compareCommercialApiEqualsSql({
        label: "pf.total",
        apiCount: pfTotal,
        sqlCount: Number(pfSummary!.totalCount ?? 0),
        sqlName: "summary pf_violation.totalCount",
      });
    });
    const pfDomestic = await pfApi.getPfAnalysis({
      month,
      year,
      threshold: pfAnalysisQuery.threshold,
      page: 1,
      pageSize: 10,
      connectionCategory: "domestic",
    });
    const pfNonDomestic = await pfApi.getPfAnalysis({
      month,
      year,
      threshold: pfAnalysisQuery.threshold,
      page: 1,
      pageSize: 10,
      connectionCategory: "non-domestic",
    });
    validation.execute("pf domestic === summary.domesticCount", () => {
      compareCommercialApiEqualsSql({
        label: "pf.domestic",
        apiCount: gridTotal(pfDomestic.responseBody.data, month, year),
        sqlCount: Number(pfSummary!.domesticCount ?? 0),
        sqlName: "summary pf_violation.domesticCount",
      });
    });
    validation.execute("pf non-domestic === summary.nonDomesticCount", () => {
      compareCommercialApiEqualsSql({
        label: "pf.nonDomestic",
        apiCount: gridTotal(pfNonDomestic.responseBody.data, month, year),
        sqlCount: Number(pfSummary!.nonDomesticCount ?? 0),
        sqlName: "summary pf_violation.nonDomesticCount",
      });
    });

    await assertPfPageUniqueAndAgainstDb({
      db,
      validation,
      label: "domestic",
      responseBody: pfDomestic.responseBody,
    });
    await assertPfPageUniqueAndAgainstDb({
      db,
      validation,
      label: "non-domestic",
      responseBody: pfNonDomestic.responseBody,
    });
  }

  const lfApi = new LFAnalysisApi(authenticatedApi);
  for (const type of LF_VALIDATABLE_TYPES) {
    const analysisType = Object.entries(SUMMARY_TO_LF_TYPE).find(
      ([, label]) => label === type,
    )?.[0];
    if (!analysisType) continue;
    const summaryRow = reports.get(analysisType);
    if (!isAvailable(summaryRow)) continue;
    const lfBody = await lfApi.getLFAnalysis({
      month,
      year,
      type,
      page: 1,
      pageSize: 10,
    });
    expect(lfBody.rawResponse.status()).toBe(200);
    validation.execute(`lf(${type}) === summary.${analysisType}`, () => {
      compareCommercialApiEqualsSql({
        label: `lf(${type}).total`,
        apiCount: gridTotal(lfBody.responseBody.data, month, year),
        sqlCount: Number(summaryRow!.totalCount ?? 0),
        sqlName: `summary ${analysisType}.totalCount`,
      });
    });
    await assertLfPageUniqueAndAgainstDb({
      db,
      validation,
      label: `${type} unfiltered`,
      responseBody: lfBody.responseBody,
    });
    const lfDomestic = await lfApi.getLFAnalysis({
      month,
      year,
      type,
      page: 1,
      pageSize: 10,
      connectionCategory: "domestic",
    });
    expect(lfDomestic.rawResponse.status()).toBe(200);
    validation.execute(
      `lf(${type}) domestic total equals unfiltered (category stripped)`,
      () => {
        compareCommercialApiEqualsSql({
          label: `lf(${type}).domestic`,
          apiCount: gridTotal(lfDomestic.responseBody.data, month, year),
          sqlCount: Number(summaryRow!.totalCount ?? 0),
          sqlName: `summary ${analysisType}.totalCount`,
        });
      },
    );
    await assertLfPageUniqueAndAgainstDb({
      db,
      validation,
      label: `${type} domestic`,
      responseBody: lfDomestic.responseBody,
    });
    const lfNonDomestic = await lfApi.getLFAnalysis({
      month,
      year,
      type,
      page: 1,
      pageSize: 10,
      connectionCategory: "non-domestic",
    });
    expect(lfNonDomestic.rawResponse.status()).toBe(200);
    validation.execute(
      `lf(${type}) non-domestic total equals unfiltered (category stripped)`,
      () => {
        compareCommercialApiEqualsSql({
          label: `lf(${type}).nonDomestic`,
          apiCount: gridTotal(lfNonDomestic.responseBody.data, month, year),
          sqlCount: Number(summaryRow!.totalCount ?? 0),
          sqlName: `summary ${analysisType}.totalCount`,
        });
      },
    );
    await assertLfPageUniqueAndAgainstDb({
      db,
      validation,
      label: `${type} non-domestic`,
      responseBody: lfNonDomestic.responseBody,
    });
  }

  const mdApi = new MdAnalysisApi(authenticatedApi);
  for (const type of MD_ANALYSIS_TYPES) {
    const analysisType = Object.entries(SUMMARY_TO_MD_TYPE).find(
      ([, label]) => label === type,
    )?.[0];
    if (!analysisType) continue;
    const summaryRow = reports.get(analysisType);
    if (!isAvailable(summaryRow)) continue;
    const mdBody = await mdApi.getMdAnalysis({
      month,
      year,
      type,
      page: 1,
      pageSize: 10,
    });
    expect(mdBody.rawResponse.status()).toBe(200);
    validation.execute(`md(${type}) === summary.${analysisType}`, () => {
      compareCommercialApiEqualsSql({
        label: `md(${type}).total`,
        apiCount: gridTotal(mdBody.responseBody.data, month, year),
        sqlCount: Number(summaryRow!.totalCount ?? 0),
        sqlName: `summary ${analysisType}.totalCount`,
      });
    });
    await assertMdPageUniqueAndAgainstDb({
      db,
      validation,
      label: `${type} unfiltered`,
      responseBody: mdBody.responseBody,
    });
    if (
      MD_CATEGORY_SPLIT_TYPES.includes(type) &&
      Number(summaryRow!.domesticCount) + Number(summaryRow!.nonDomesticCount) >
        0
    ) {
      const mdDomestic = await mdApi.getMdAnalysis({
        month,
        year,
        type,
        page: 1,
        pageSize: 10,
        connectionCategory: "domestic",
      });
      const mdNonDomestic = await mdApi.getMdAnalysis({
        month,
        year,
        type,
        page: 1,
        pageSize: 10,
        connectionCategory: "non-domestic",
      });
      expect(mdDomestic.rawResponse.status()).toBe(200);
      expect(mdNonDomestic.rawResponse.status()).toBe(200);
      validation.execute(`md(${type}) domestic === summary.domesticCount`, () => {
        compareCommercialApiEqualsSql({
          label: `md(${type}).domestic`,
          apiCount: gridTotal(mdDomestic.responseBody.data, month, year),
          sqlCount: Number(summaryRow!.domesticCount ?? 0),
          sqlName: `summary ${analysisType}.domesticCount`,
        });
      });
      validation.execute(
        `md(${type}) non-domestic === summary.nonDomesticCount`,
        () => {
          compareCommercialApiEqualsSql({
            label: `md(${type}).nonDomestic`,
            apiCount: gridTotal(mdNonDomestic.responseBody.data, month, year),
            sqlCount: Number(summaryRow!.nonDomesticCount ?? 0),
            sqlName: `summary ${analysisType}.nonDomesticCount`,
          });
        },
      );
      await assertMdPageUniqueAndAgainstDb({
        db,
        validation,
        label: `${type} domestic`,
        responseBody: mdDomestic.responseBody,
      });
      await assertMdPageUniqueAndAgainstDb({
        db,
        validation,
        label: `${type} non-domestic`,
        responseBody: mdNonDomestic.responseBody,
      });
    }
  }

  const compareSummary = reports.get("consumption_compare_prev_month");
  if (isAvailable(compareSummary)) {
    const compareApi = new ConsumptionCompareApi(authenticatedApi);
    const compareBody = await compareApi.getConsumptionCompare({
      month,
      year,
      type: consumptionCompareLastMonthData.type,
      page: 1,
      pageSize: 10,
    });
    expect(compareBody.rawResponse.status()).toBe(200);
    validation.execute("compare last month === summary", () => {
      compareCommercialApiEqualsSql({
        label: "consumption-compare.last-month",
        apiCount: gridTotal(compareBody.responseBody.data, month, year),
        sqlCount: Number(compareSummary!.totalCount ?? 0),
        sqlName: "summary consumption_compare_prev_month.totalCount",
      });
    });
    await assertComparePageUniqueAndAgainstDb({
      db,
      validation,
      label: "Last Month unfiltered",
      responseBody: compareBody.responseBody,
    });
    const [compareDomestic, compareNonDomestic] = await Promise.all([
      compareApi.getConsumptionCompare({
        month,
        year,
        type: consumptionCompareLastMonthData.type,
        page: 1,
        pageSize: 10,
        connectionCategory: "domestic",
      }),
      compareApi.getConsumptionCompare({
        month,
        year,
        type: consumptionCompareLastMonthData.type,
        page: 1,
        pageSize: 10,
        connectionCategory: "non-domestic",
      }),
    ]);
    expect(compareDomestic.rawResponse.status()).toBe(200);
    expect(compareNonDomestic.rawResponse.status()).toBe(200);
    const unfilteredTotal = gridTotal(compareBody.responseBody.data, month, year);
    validation.execute("compare last month domestic === unfiltered", () => {
      expect(gridTotal(compareDomestic.responseBody.data, month, year)).toBe(
        unfilteredTotal,
      );
    });
    validation.execute("compare last month non-domestic === unfiltered", () => {
      expect(gridTotal(compareNonDomestic.responseBody.data, month, year)).toBe(
        unfilteredTotal,
      );
    });
    await assertComparePageUniqueAndAgainstDb({
      db,
      validation,
      label: "Last Month domestic",
      responseBody: compareDomestic.responseBody,
    });
    await assertComparePageUniqueAndAgainstDb({
      db,
      validation,
      label: "Last Month non-domestic",
      responseBody: compareNonDomestic.responseBody,
    });
  }

  const patternApi = new ConsumptionPatternApi(authenticatedApi);
  const zero1m = reports.get("zero_consumption_1m");
  if (isAvailable(zero1m)) {
    const patternBody = await patternApi.getConsumptionPattern({
      month,
      year,
      type: consumptionPatternData.type,
      connectionCategory: "domestic",
      page: 1,
      pageSize: 10,
    });
    expect(patternBody.rawResponse.status()).toBe(200);
    validation.execute("zero 1m === summary.totalCount", () => {
      compareCommercialApiEqualsSql({
        label: "pattern.zero-1m",
        apiCount: gridTotal(patternBody.responseBody.data, month, year),
        sqlCount: Number(zero1m!.totalCount ?? 0),
        sqlName: "summary zero_consumption_1m.totalCount",
      });
    });
  }

  const zero3m = reports.get("zero_consumption_3m");
  if (isAvailable(zero3m)) {
    const pattern3m = await patternApi.getConsumptionPattern({
      month,
      year,
      type: consumptionPatternZero3mData.type,
      connectionCategory: "domestic",
      page: 1,
      pageSize: 10,
    });
    expect(pattern3m.rawResponse.status()).toBe(200);
    validation.execute("zero 3m === summary.totalCount", () => {
      compareCommercialApiEqualsSql({
        label: "pattern.zero-3m",
        apiCount: gridTotal(pattern3m.responseBody.data, month, year),
        sqlCount: Number(zero3m!.totalCount ?? 0),
        sqlName: "summary zero_consumption_3m.totalCount",
      });
    });
  }

  const low3m = reports.get("low_consumption_100_units_3m");
  if (isAvailable(low3m)) {
    const lowBody = await patternApi.getConsumptionPattern({
      month,
      year,
      type: consumptionPatternLow3mData.type,
      connectionCategory: "domestic",
    page: 1,
      pageSize: 10,
    });
    expect(lowBody.rawResponse.status()).toBe(200);
    validation.execute("100-unit 3m === summary", () => {
      compareCommercialApiEqualsSql({
        label: "pattern.100-unit-3m",
        apiCount: gridTotal(lowBody.responseBody.data, month, year),
        sqlCount: Number(low3m!.totalCount ?? 0),
        sqlName: "summary low_consumption_100_units_3m.totalCount",
      });
    });
  }

  const dayNightApi = new DayNightApi(authenticatedApi);
  for (const [analysisType, type] of Object.entries(SUMMARY_TO_DAY_NIGHT)) {
    const summaryRow = reports.get(analysisType);
    if (!isAvailable(summaryRow)) continue;
    const nightBody = await dayNightApi.getDayNight({
      ...dayNightCountBase,
      type,
      month,
      year,
    });
    expect(nightBody.rawResponse.status()).toBe(200);
    validation.execute(`day-night(${type}) === summary.${analysisType}`, () => {
      compareCommercialApiEqualsSql({
        label: `day-night(${type})`,
        apiCount: gridTotal(nightBody.responseBody.data, month, year),
        sqlCount: Number(summaryRow!.totalCount ?? 0),
        sqlName: `summary ${analysisType}.totalCount`,
      });
    });
    await assertDayNightPageUniqueAndAgainstDb({
      db,
      validation,
      label: `${type} domestic`,
      responseBody: nightBody.responseBody,
    });
    const nightNonDomestic = await dayNightApi.getDayNight({
      ...dayNightCountBase,
      type,
      month,
      year,
      connectionCategory: "non-domestic",
    });
    expect(nightNonDomestic.rawResponse.status()).toBe(200);
    validation.execute(`day-night(${type}) non-domestic === domestic`, () => {
      expect(gridTotal(nightNonDomestic.responseBody.data, month, year)).toBe(
        gridTotal(nightBody.responseBody.data, month, year),
      );
    });
    await assertDayNightPageUniqueAndAgainstDb({
      db,
      validation,
      label: `${type} non-domestic`,
      responseBody: nightNonDomestic.responseBody,
    });
  }

  if (archiveDb && isArchiveDbConfigured()) {
    const sqlLf = await countCommercialLfLt5Reporting(archiveDb, month, year);
    const lfLt5Summary = reports.get("lf_lt_5");
    if (sqlLf != null && isAvailable(lfLt5Summary)) {
      validation.execute("lf < 5% === reporting commercialLfLt5SummarySql", () => {
        compareCommercialApiEqualsSql({
          label: "lf_lt_5.reporting",
          apiCount: Number(lfLt5Summary!.totalCount ?? 0),
          sqlCount: sqlLf,
          sqlName: "commercialLfLt5SummarySql (unscoped)",
        });
      });
    }
  }

  validation.finalize(
    "COMMERICIAL-ANALYSIS summary vs drilldowns vs reporting SQL",
    0,
  );
}
