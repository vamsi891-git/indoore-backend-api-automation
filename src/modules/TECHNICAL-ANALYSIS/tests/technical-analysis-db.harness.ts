import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { TechnicalSummaryApi } from "../Api/technical-summary.api";
import { TechnicalReportApi } from "../Api/technicalanalysis.api";
import {
  resolveTechnicalSummaryQuery,
  technicalSummaryDefaultMonth,
  technicalSummaryDefaultYear,
} from "../Data/technical-summary.data";
import {
  resolveTechnicalReportQuery,
  technicalAnalysisDefaultAnalysisType,
  technicalAnalysisLiveConfigs,
} from "../Data/technicalanalysis.data";
import { TechnicalSummaryMapper } from "../Mapper/technical-summary.mapper";
import { TechnicalReportMapper } from "../Mapper/technicalanalysis.mapper";
import {
  countTechnicalConsumerMeters,
  getTechnicalConsumerByIvrsOrMsn,
  resolveTechnicalAnalysisDbSampleSize,
} from "../Db/technical-analysis.db";
import {
  compareSummaryTotalToReportTotal,
  compareTechnicalReportRowToDb,
} from "../Db/technical-analysis-db-compare";
import {
  TechnicalAnalysisDbValidator,
  logTechnicalAnalysisDataQualityFindings,
} from "../Db/technical-analysis-db.validator";

/**
 * Part 4 harness — summary↔report consistency + V_Consumerdetails row spot-checks.
 */
export async function runTechnicalAnalysisDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ValidationEngine();
  const summaryApi = new TechnicalSummaryApi(authenticatedApi);
  const reportApi = new TechnicalReportApi(authenticatedApi);
  const sampleSize = resolveTechnicalAnalysisDbSampleSize();

  const liveConfig =
    technicalAnalysisLiveConfigs.find(
      (c) => c.analysisType === technicalAnalysisDefaultAnalysisType && c.hasData,
    ) ?? technicalAnalysisLiveConfigs.find((c) => c.hasData);

  const summaryBody = await summaryApi.getTechnicalSummary(
    resolveTechnicalSummaryQuery("dev_live_primary"),
  );
  const summaryMapped = TechnicalSummaryMapper.map(summaryBody.responseBody);
  await logTechnicalAnalysisDataQualityFindings(
    "summary",
    summaryMapped as unknown as Record<string, unknown>,
  );

  const reportQuery = resolveTechnicalReportQuery(
    "dev_live_report",
    liveConfig,
  );
  const reportBody = await reportApi.getTechnicalReport(reportQuery);
  const reportMapped = TechnicalReportMapper.map(
    reportBody.responseBody,
    {
      analysisType: String(reportQuery.analysisType ?? technicalAnalysisDefaultAnalysisType),
      month: Number(reportQuery.month ?? technicalSummaryDefaultMonth),
      year: Number(reportQuery.year ?? technicalSummaryDefaultYear),
      pageSize: Number(reportQuery.pageSize ?? 100),
      category: String(reportQuery.category ?? "total"),
      page: Number(reportQuery.page ?? 1),
    },
  );
  await logTechnicalAnalysisDataQualityFindings(
    "report",
    {
      rows: reportMapped.rows,
    } as unknown as Record<string, unknown>,
  );

  const analysisType = reportMapped.analysisType;
  const summaryRow = summaryMapped.reports.find(
    (r) => r.analysisType === analysisType,
  );
  if (summaryRow) {
    validation.execute("Summary totalCount vs report pagination.total", () => {
      compareSummaryTotalToReportTotal({
        summaryTotal: summaryRow.totalCount,
        reportPaginationTotal: reportMapped.totalCount,
        analysisType,
      });
    });
  }

  const spotRows = reportMapped.rows
    .filter((r) => String(r.ivrsNumber ?? "").trim() || String(r.msn ?? "").trim())
    .slice(0, sampleSize);

  for (const row of spotRows) {
    const lookup =
      String(row.ivrsNumber ?? "").trim() || String(row.msn ?? "").trim();
    const dbRow = await getTechnicalConsumerByIvrsOrMsn(db, lookup);
    validation.execute(`Report row vs V_Consumerdetails (${lookup})`, () => {
      compareTechnicalReportRowToDb({
        api: {
          ivrsNumber: row.ivrsNumber,
          msn: row.msn,
          meterLookupId: row.meterLookupId,
          name: row.name,
        },
        dbRow,
        lookupKey: lookup,
      });
    });
  }

  const universe = await countTechnicalConsumerMeters(db);
  validation.execute("Report page size within consumer-meter universe", () => {
    TechnicalAnalysisDbValidator.assertApiLteDb(
      "report.rows.length",
      reportMapped.rows.length,
      universe,
    );
  });

  validation.printSummary("Technical Analysis DB Coverage", 0);
}
