import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ConsumerDetailApi } from "../Api/consumer-detail.api";
import { MeterValidationApi } from "../Api/meter-validation.api";
import { DashboardSummaryApi } from "../Api/dashboard-summary.api";
import { SubmissionHistoryApi } from "../Api/submission-history.api";
import { SubmissionDetailApi } from "../Api/submission-detail.api";
import { ProgressApi } from "../Api/progress.api";
import { consumerDetailData } from "../Data/consumer-detail.data";
import { meterValidationData } from "../Data/meter-validation.data";
import { submissionHistoryData } from "../Data/submission-history.data";
import { submissionDetailData } from "../Data/submission-detail.data";
import { ConsumerDetailMapper } from "../Mapper/consumer-detail.mapper";
import { MeterValidationMapper } from "../Mapper/meter-validation.mapper";
import { DashboardSummaryMapper } from "../Mapper/dashboard-summary.mapper";
import { SubmissionHistoryMapper } from "../Mapper/submission-history.mapper";
import { SubmissionDetailMapper } from "../Mapper/submission-detail.mapper";
import { ProgressMapper } from "../Mapper/progress.mapper";
import {
  countMrSubmissions,
  getMrConsumerById,
  getMrDashboardOverall,
  getMrMeterBySerial,
  getMrMyWorkBySubmitter,
  getMrSubmissionById,
  sumMrProgressWeekly,
} from "../Db/meter-replacement.db";
import {
  compareMrConsumerDetailToDb,
  compareMrCountLteDb,
  compareMrDashboardOverallToDb,
  compareMrMeterValidationToDb,
  compareMrMyWorkToDb,
  compareMrSubmissionDetailToDb,
} from "../Db/meter-replacement-db-compare";
import { logMeterReplacementDataQualityFindings } from "../Db/meter-replacement-db.validator";

function resolveConsumerId(): number {
  const fromEnv = Number(process.env.METER_REPLACEMENT_CONSUMER_ID ?? "");
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return Math.floor(fromEnv);
  }
  return consumerDetailData.consumerId;
}
function resolveValidateSerial(): string {
  return (
    process.env.METER_REPLACEMENT_VALIDATE_SERIAL?.trim() ||
    meterValidationData.validMeterSerial
  );
}
function resolveSubmissionId(): number {
  const fromEnv = Number(process.env.METER_REPLACEMENT_SUBMISSION_ID ?? "");
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return Math.floor(fromEnv);
  }
  return submissionDetailData.submissionId;
}
function resolveSubmittedByUuid(): string {
  return process.env.METER_REPLACEMENT_SUBMITTED_BY?.trim() ?? "";
}
/**
 * Part 4 harness — aligned with MeterReplacementRepository SQL paste.
 */
export async function runMeterReplacementDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ValidationEngine();
  const consumerId = resolveConsumerId();
  const serial = resolveValidateSerial();
  const submissionId = resolveSubmissionId();
  const submittedBy = resolveSubmittedByUuid();
  // --- Dashboard overall (unscoped COUNT on general.meter_replacement) ---
  const summaryBody = await new DashboardSummaryApi(
    authenticatedApi,
  ).getDashboardSummary();
  const summary = DashboardSummaryMapper.map(summaryBody.responseBody);
  await logMeterReplacementDataQualityFindings(
    "dashboard-summary",
    summaryBody.responseBody.data as unknown as Record<string, unknown>,
  );
  const dbOverall = await getMrDashboardOverall(db);
  validation.execute("Dashboard overall vs general.meter_replacement", () => {
    compareMrDashboardOverallToDb({
      api: summary.overall,
      dbRow: dbOverall,
    });
  });

  if (submittedBy) {
    const dbMyWork = await getMrMyWorkBySubmitter(db, submittedBy);
    if (dbMyWork) {
      validation.execute("Dashboard myWork vs submitted_by", () => {
        compareMrMyWorkToDb({
          api: {
            completedToday: summary.myWork.completedToday,
            completedThisMonth: summary.myWork.completedThisMonth,
            totalCompleted: summary.myWork.totalCompleted,
          },
          dbRow: dbMyWork,
        });
      });
    }
    const progressBody = await new ProgressApi(authenticatedApi).getProgress();
    const progress = ProgressMapper.map(progressBody.responseBody);
    const apiWeeklySum = progress.weekly.values.reduce((a, b) => a + b, 0);
    const dbWeeklySum = await sumMrProgressWeekly(db, submittedBy);
    validation.execute("Progress weekly sum ≤ DB completed (7d)", () => {
      compareMrCountLteDb({
        label: "progress.weekly.sum",
        apiCount: apiWeeklySum,
        dbCount: dbWeeklySum,
      });
    });
  }
  // --- Consumer detail ---
  const detailBody = await new ConsumerDetailApi(
    authenticatedApi,
  ).getConsumerDetail(consumerId);
  const detail = ConsumerDetailMapper.map(detailBody.responseBody);
  await logMeterReplacementDataQualityFindings(
    "consumer-detail",
    detail as unknown as Record<string, unknown>,
  );
  const dbConsumer = await getMrConsumerById(db, consumerId);
  validation.execute("Consumer detail vs master-consumer SQL", () => {
    compareMrConsumerDetailToDb({
      api: {
        consumerId: detail.consumerId,
        consumer: detail.consumer,
        accountId: detail.accountId,
        rrNumber: detail.rrNumber,
        ivrs: detail.ivrs,
        oldMeterSerial: detail.oldMeterSerial,
        oldMeterLookupId: detail.oldMeterLookupId,
        servicePointId: detail.servicePointId,
      },
      dbRow: dbConsumer,
      lookupKey: consumerId,
    });
  });
  // --- Meter validate ---
  const validateBody = await new MeterValidationApi(
    authenticatedApi,
  ).validateMeter(serial);
  const validated = MeterValidationMapper.map(validateBody.responseBody);
  await logMeterReplacementDataQualityFindings(
    "meter-validation",
    validated as unknown as Record<string, unknown>,
  );
  if (validated.meterSerial?.trim() || serial) {
    const lookupSerial = validated.meterSerial?.trim() || serial;
    const dbMeter = await getMrMeterBySerial(db, lookupSerial);
    validation.execute("Meter validate vs findMeterForValidation SQL", () => {
      if (!validated.valid && !dbMeter) {
        return;
      }
      compareMrMeterValidationToDb({
        api: {
          meterSerial: lookupSerial,
          meterLookupId: validated.meterLookupId,
          valid: validated.valid,
        },
        dbRow: dbMeter,
      });
    });
  }
  // --- Submission history total ---
  const historyBody = await new SubmissionHistoryApi(
    authenticatedApi,
  ).getSubmissionHistory(
    submissionHistoryData.page,
    submissionHistoryData.limit,
  );
  const history = SubmissionHistoryMapper.map(historyBody.responseBody);
  const dbHistoryTotal = await countMrSubmissions(db);
  validation.execute("History pagination.total ≤ DB submissions", () => {
    compareMrCountLteDb({
      label: "submissionHistory.pagination.total",
      apiCount: history.pagination.total,
      dbCount: dbHistoryTotal,
    });
  });
  // --- Submission detail ---
  const submissionBody = await new SubmissionDetailApi(
    authenticatedApi,
  ).getSubmissionDetail(submissionId);
  if (submissionBody.rawResponse.status() === 200 && submissionBody.responseBody.success) {
    const submission = SubmissionDetailMapper.map(submissionBody.responseBody);
    await logMeterReplacementDataQualityFindings(
      "submission-detail",
      submission as unknown as Record<string, unknown>,
    );
    const dbSubmission = await getMrSubmissionById(db, submissionId);
    validation.execute("Submission detail vs general.meter_replacement", () => {
      compareMrSubmissionDetailToDb({
        api: {
          id: submission.id,
          status: submission.status,
          consumerId: submission.consumer.consumerId,
          oldMeterSerial: submission.oldMeter.meterSerial,
          newMeterSerial: submission.newMeter.meterSerial,
        },
        dbRow: dbSubmission,
        lookupKey: submissionId,
      });
    });
  }
  validation.printSummary("Meter Replacement DB Coverage", 0);
}
