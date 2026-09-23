import { z } from "zod";

export const ZoneWiseAtrUploadItemSchema = z
  .object({
    uploadId: z.string(),
    submissionId: z.string(),
    originalFileName: z.string(),
    mimeType: z.string(),
    fileSizeBytes: z.number(),
    hasOriginalFile: z.boolean(),
    month: z.union([z.number(), z.string()]),
    year: z.union([z.number(), z.string()]),
    uploadedByUserId: z.string(),
    uploadedByName: z.string(),
    uploadedAt: z.string(),
    totalRecords: z.number(),
    validRecords: z.number(),
    invalidRecords: z.number(),
    duplicateRecords: z.number(),
    importedRecords: z.number(),
    failedRecords: z.number(),
    status: z.string(),
  })
  .passthrough();

export const ZoneWiseAtrUploadsDataSchema = z
  .object({
    items: z.array(ZoneWiseAtrUploadItemSchema),
    page: z.union([z.number(), z.string()]),
    limit: z.union([z.number(), z.string()]),
    total: z.union([z.number(), z.string()]),
    totalPages: z.union([z.number(), z.string()]),
  })
  .passthrough();

export const ZoneWiseAtrUploadsSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: ZoneWiseAtrUploadsDataSchema,
});

export const ZoneWiseAtrUploadsSummaryDataSchema = z
  .object({
    uploads: z.number(),
    pendingApproval: z.number(),
    completed: z.number(),
    partiallyCompleted: z.number(),
    failed: z.number(),
    totalRecords: z.number(),
    imported: z.number(),
    invalid: z.number(),
    duplicates: z.number(),
  })
  .passthrough();

export const ZoneWiseAtrUploadsSummarySuccessResponseSchema = z.object({
  success: z.literal(true),
  data: ZoneWiseAtrUploadsSummaryDataSchema,
});
