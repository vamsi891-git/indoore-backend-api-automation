import { z } from "zod";
import { ColumnSchema, PaginationSchema } from "../../../core/schemas/api-response.schemas";

/** Rows differ by reportType — keep passthrough and require id. */
export const AtrReportRowSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
  })
  .passthrough();

export const AtrReportDataSchema = z
  .object({
    columns: z.array(ColumnSchema),
    rows: z.array(AtrReportRowSchema),
    pagination: PaginationSchema,
  })
  .passthrough();

export const AtrReportSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: AtrReportDataSchema,
});

export type ParsedAtrReportResponse = z.infer<typeof AtrReportSuccessResponseSchema>;
