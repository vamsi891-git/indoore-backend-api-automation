import { z } from "zod";
import { ColumnSchema, PaginationSchema } from "../../../core/schemas/api-response.schemas";

export const ZoneWiseAtrEventsRowSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
  })
  .passthrough();

export const ZoneWiseAtrEventsDataSchema = z
  .object({
    columns: z.array(ColumnSchema),
    rows: z.array(ZoneWiseAtrEventsRowSchema),
    pagination: PaginationSchema,
  })
  .passthrough();

export const ZoneWiseAtrEventsSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: ZoneWiseAtrEventsDataSchema,
});

export const ZoneWiseAtrEventsImportDataSchema = z
  .object({
    uploadId: z.string(),
    submissionId: z.string(),
    status: z.string(),
    totalRows: z.number(),
    successfulRows: z.number(),
    failedRows: z.number(),
    skippedDuplicateRows: z.number(),
    validRecords: z.number(),
    invalidRecords: z.number(),
    duplicateRecords: z.number(),
    importedRecords: z.number(),
    failedRecords: z.number(),
    errors: z.array(z.unknown()),
  })
  .passthrough();

export const ZoneWiseAtrEventsImportSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: ZoneWiseAtrEventsImportDataSchema,
});
