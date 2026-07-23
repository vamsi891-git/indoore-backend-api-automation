import { z } from "zod";

const emptyable = z.string();
const requiredText = z.string().trim().min(1);
const meterStatusSchema = z.enum(["ACTIVE", "INACTIVE", "UNKNOWN"]);
const consumerStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
const submissionStatusSchema = z.enum(["PENDING", "COMPLETED"]);

const overallSchema = z
  .object({
    totalMetersRequested: z.number().int().nonnegative(),
    totalMetersReplaced: z.number().int().nonnegative(),
    totalPendingMeters: z.number().int().nonnegative(),
    totalUnmappedMeters: z.number().int().nonnegative(),
  })
  .passthrough();

const myWorkSchema = z
  .object({
    completedToday: z.number().int().nonnegative(),
    completedThisMonth: z.number().int().nonnegative(),
    totalCompleted: z.number().int().nonnegative(),
    latestCompletedDate: emptyable.nullable(),
  })
  .passthrough();

export const DashboardSummarySuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        overall: overallSchema,
        myWork: myWorkSchema,
      })
      .passthrough(),
  })
  .strict();

const progressChartSchema = z
  .object({
    labels: z.array(emptyable),
    values: z.array(z.number()),
  })
  .passthrough();

export const ProgressSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        weekly: progressChartSchema,
        monthly: progressChartSchema,
      })
      .passthrough(),
  })
  .strict();

const consumerSearchItemSchema = z
  .object({
    consumerId: z.number().int().positive(),
    consumerName: emptyable,
  })
  .passthrough();

export const ConsumerSearchSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(consumerSearchItemSchema),
  })
  .strict();

export const ConsumerDetailSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        consumer: emptyable,
        ivrs: emptyable,
        rrNumber: emptyable,
        consumerId: z.number().int().positive(),
        consumerCid: emptyable,
        accountId: emptyable,
        servicePointId: emptyable,
        address: emptyable,
        zone: emptyable,
        office: emptyable,
        oldMeterLookupId: z.number().int(),
        oldMeterSerial: emptyable,
        oldMeterStatus: z.enum(["ACTIVE", "INACTIVE"]),
        latitude: emptyable,
        longitude: emptyable,
        consumerStatus: consumerStatusSchema,
        replacementEligible: z.boolean(),
      })
      .passthrough(),
  })
  .strict();

export const MeterValidationSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        valid: z.boolean(),
        message: emptyable,
        meterLookupId: z.number().int().nonnegative(),
        meterSerial: emptyable,
      })
      .passthrough(),
  })
  .strict();

const historyItemSchema = z
  .object({
    id: z.number().int().positive(),
    consumerName: emptyable,
    oldMeterSerial: emptyable,
    newMeterSerial: emptyable.nullable(),
    replacementReason: emptyable.nullable(),
    status: submissionStatusSchema,
    createdAt: emptyable,
  })
  .passthrough();

const paginationSchema = z
  .object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .passthrough();

export const SubmissionHistorySuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        items: z.array(historyItemSchema),
        pagination: paginationSchema,
      })
      .passthrough(),
  })
  .strict();

const submissionMeterSchema = z
  .object({
    meterLookupId: z.number().int().nullable(),
    meterSerial: emptyable,
    meterReading: emptyable.nullable(),
    meterStatus: meterStatusSchema,
  })
  .passthrough();

const submissionConsumerSchema = z
  .object({
    consumerId: z.number().int().nonnegative(),
    consumerCid: emptyable,
    consumerName: emptyable,
    ivrs: emptyable,
    rrNumber: emptyable,
    accountId: emptyable,
    servicePointId: emptyable,
    address: emptyable,
    zone: emptyable,
    office: emptyable,
    consumerStatus: consumerStatusSchema,
  })
  .passthrough();

export const SubmissionDetailSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        id: z.number().int().positive(),
        status: submissionStatusSchema,
        createdDate: emptyable,
        completedDate: emptyable.nullable(),
        consumer: submissionConsumerSchema,
        oldMeter: submissionMeterSchema,
        newMeter: submissionMeterSchema,
        replacementReason: emptyable.nullable(),
        remarks: emptyable.nullable(),
        latitude: emptyable.nullable(),
        longitude: emptyable.nullable(),
        submittedBy: emptyable,
      })
      .passthrough(),
  })
  .strict();

export const CreateSubmissionSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        id: z.number().int().positive(),
        status: requiredText,
      })
      .passthrough(),
  })
  .strict();

export const BulkValidateMeterReplacementRowSchema = z
  .object({
    row: z.number().int().positive(),
    valid: z.boolean(),
    errors: z.array(z.string()).optional(),
  })
  .passthrough();

export const BulkValidateMeterReplacementSummarySchema = z
  .object({
    totalRows: z.number().int().nonnegative(),
    validRows: z.number().int().nonnegative(),
    invalidRows: z.number().int().nonnegative(),
  })
  .passthrough();

/** Success shape when the uploaded file is structurally valid (dry-run). */
export const BulkValidateMeterReplacementSuccessResponseSchema = z.object({
  success: z.literal(true),
  summary: BulkValidateMeterReplacementSummarySchema,
  rows: z.array(BulkValidateMeterReplacementRowSchema),
});
