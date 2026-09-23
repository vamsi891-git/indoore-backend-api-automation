import type {
  ZoneWiseAtrUploadItem,
  ZoneWiseAtrUploadsData,
  ZoneWiseAtrUploadsResponse,
  ZoneWiseAtrUploadsSummary,
  ZoneWiseAtrUploadsSummaryResponse,
} from "./zone-wise-atr-uploads.types";

export type {
  ZoneWiseAtrUploadStatus,
  ZoneWiseAtrUploadsQuery,
  ZoneWiseAtrUploadItem,
  ZoneWiseAtrUploadsData,
  ZoneWiseAtrUploadsResponse,
  ZoneWiseAtrUploadsSummaryQuery,
  ZoneWiseAtrUploadsSummary,
  ZoneWiseAtrUploadsSummaryResponse,
} from "./zone-wise-atr-uploads.types";

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

function toNullableText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
}

export class ZoneWiseAtrUploadsMapper {
  static mapData(raw: ZoneWiseAtrUploadsResponse["data"] | undefined): ZoneWiseAtrUploadsData {
    return {
      page: toNumber(raw?.page, 1),
      limit: toNumber(raw?.limit, 10),
      total: toNumber(raw?.total, 0),
      totalPages: toNumber(raw?.totalPages, 0),
      items: (raw?.items ?? []).map(
        (row): ZoneWiseAtrUploadItem => ({
          uploadId: toText(row.uploadId),
          submissionId: toText(row.submissionId),
          originalFileName: toText(row.originalFileName),
          mimeType: toText(row.mimeType),
          fileSizeBytes: toNumber(row.fileSizeBytes),
          hasOriginalFile: Boolean(row.hasOriginalFile),
          month: toNumber(row.month),
          year: toNumber(row.year),
          uploadedByUserId: toText(row.uploadedByUserId),
          uploadedByName: toText(row.uploadedByName),
          uploadedAt: toText(row.uploadedAt),
          organisationLookupId:
            row.organisationLookupId === null || row.organisationLookupId === undefined
              ? null
              : (row.organisationLookupId as string | number),
          networkLookupId:
            row.networkLookupId === null || row.networkLookupId === undefined
              ? null
              : (row.networkLookupId as string | number),
          totalRecords: toNumber(row.totalRecords),
          validRecords: toNumber(row.validRecords),
          invalidRecords: toNumber(row.invalidRecords),
          duplicateRecords: toNumber(row.duplicateRecords),
          importedRecords: toNumber(row.importedRecords),
          failedRecords: toNumber(row.failedRecords),
          status: toText(row.status),
          processingStartedAt: toNullableText(row.processingStartedAt),
          processingCompletedAt: toNullableText(row.processingCompletedAt),
          processingDurationMs: toNullableNumber(row.processingDurationMs),
        }),
      ),
    };
  }

  static mapSummary(
    raw: ZoneWiseAtrUploadsSummaryResponse["data"] | undefined,
  ): ZoneWiseAtrUploadsSummary {
    return {
      uploads: toNumber(raw?.uploads),
      pendingApproval: toNumber(raw?.pendingApproval),
      completed: toNumber(raw?.completed),
      partiallyCompleted: toNumber(raw?.partiallyCompleted),
      failed: toNumber(raw?.failed),
      totalRecords: toNumber(raw?.totalRecords),
      imported: toNumber(raw?.imported),
      invalid: toNumber(raw?.invalid),
      duplicates: toNumber(raw?.duplicates),
    };
  }
}
