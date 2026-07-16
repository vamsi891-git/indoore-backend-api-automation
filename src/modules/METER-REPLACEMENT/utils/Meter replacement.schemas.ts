import { z } from "zod";

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

/** Success shape returned whenever the file itself is structurally valid. */
export const BulkValidateMeterReplacementSuccessResponseSchema = z.object({
  success: z.literal(true),
  summary: BulkValidateMeterReplacementSummarySchema,
  rows: z.array(BulkValidateMeterReplacementRowSchema),
});