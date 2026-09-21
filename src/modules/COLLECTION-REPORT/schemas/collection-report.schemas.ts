import { z } from "zod";

const emptyable = z.string();
const requiredText = z.string().trim().min(1);

const columnSchema = z
  .object({
    key: requiredText,
    header: requiredText,
  })
  .passthrough();

const paginationSchema = z
  .object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    hasMore: z.boolean().optional().nullable(),
  })
  .passthrough();

const rowSchema = z.record(z.string(), z.unknown());

export const CollectionReportSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        columns: z.array(columnSchema),
        rows: z.array(rowSchema),
        pagination: paginationSchema,
        metersFetched: z.number().int().nonnegative().optional().nullable(),
        hasMore: z.boolean().optional().nullable(),
        nextMeterLookupId: z.number().int().positive().optional().nullable(),
      })
      .passthrough(),
    message: emptyable.optional(),
  })
  .strict();

export const CollectionReportValidationErrorSchema = z
  .object({
    success: z.literal(false),
    error: z
      .object({
        code: requiredText,
        message: requiredText,
        details: z.unknown().optional(),
      })
      .passthrough(),
  })
  .passthrough();
