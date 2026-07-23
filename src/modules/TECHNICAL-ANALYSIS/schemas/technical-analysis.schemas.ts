import { z } from "zod";

const emptyable = z.string();
const requiredText = z.string().trim().min(1);

const technicalSummaryReportSchema = z
  .object({
    analysisType: requiredText,
    reportName: emptyable,
    category: emptyable,
    totalCount: z.number().int().nonnegative(),
    domesticCount: z.number().int().nonnegative(),
    nonDomesticCount: z.number().int().nonnegative(),
  })
  .passthrough();

export const TechnicalSummarySuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(2000),
        reports: z.array(technicalSummaryReportSchema),
      })
      .passthrough(),
  })
  .strict();

const technicalReportRowSchema = z
  .object({
    meterLookupId: z.number().int().positive(),
    subDivision: emptyable,
    subStation: emptyable,
    feeder: emptyable,
    dtr: emptyable,
    name: emptyable,
    address: emptyable,
    ivrsNumber: emptyable,
    category: emptyable,
    msn: emptyable,
    phase: emptyable,
    durationInHours: z.number().optional(),
    eventName: emptyable,
    id: emptyable.optional(),
  })
  .passthrough();

const technicalGridPaginationSchema = z
  .object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .passthrough();

/** Live grid shape: columns + rows + pagination. */
export const TechnicalReportSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        columns: z
          .array(
            z
              .object({
                key: requiredText,
                header: requiredText,
              })
              .passthrough(),
          )
          .optional(),
        rows: z.array(technicalReportRowSchema),
        pagination: technicalGridPaginationSchema,
      })
      .passthrough(),
  })
  .strict();
