import { z } from "zod";
import { ColumnSchema, PaginationSchema } from "../../../core/schemas/api-response.schemas";

/** Rows differ by reportType/level — keep passthrough and require id. */
export const AtrSummaryRowSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
  })
  .passthrough();

export const AtrSummaryContextSchema = z.object({
  reportType: z.string(),
  level: z.string(),
  parentId: z.union([z.string(), z.number(), z.null()]),
});

export const AtrSummaryTotalsSchema = z
  .object({
    totalCases: z.union([z.number(), z.null()]).optional(),
    totalAttended: z.union([z.number(), z.null()]).optional(),
    pending: z.union([z.number(), z.null()]).optional(),
    billedAmount: z.union([z.number(), z.null()]).optional(),
    recoveredAmount: z.union([z.number(), z.null()]).optional(),
    billingEfficiency: z.union([z.number(), z.null()]).optional(),
    unitsGain: z.union([z.number(), z.null()]).optional(),
    revenueGain: z.union([z.number(), z.null()]).optional(),
  })
  .passthrough()
  .nullable();

export const AtrSummaryDataSchema = z
  .object({
    columns: z.array(ColumnSchema),
    rows: z.array(AtrSummaryRowSchema),
    pagination: PaginationSchema,
    context: AtrSummaryContextSchema,
    totals: AtrSummaryTotalsSchema.optional(),
  })
  .passthrough();

export const AtrSummarySuccessResponseSchema = z.object({
  success: z.literal(true),
  data: AtrSummaryDataSchema,
});

export type ParsedAtrSummaryResponse = z.infer<typeof AtrSummarySuccessResponseSchema>;
