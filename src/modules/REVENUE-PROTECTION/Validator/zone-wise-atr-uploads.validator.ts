import { expect } from "@playwright/test";
import type {
  ZoneWiseAtrUploadsData,
  ZoneWiseAtrUploadsQuery,
  ZoneWiseAtrUploadsResponse,
  ZoneWiseAtrUploadsSummary,
  ZoneWiseAtrUploadsSummaryResponse,
} from "../Mapper/zone-wise-atr-uploads.types";
import { ZONE_WISE_ATR_UPLOAD_STATUSES } from "../Data/zone-wise-atr-uploads.data";

export class ZoneWiseAtrUploadsValidator {
  validateResponse(response: ZoneWiseAtrUploadsResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateSummaryResponse(response: ZoneWiseAtrUploadsSummaryResponse): void {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateItemsExist(data: ZoneWiseAtrUploadsData): void {
    expect(Array.isArray(data.items)).toBeTruthy();
    if (data.total > 0 && data.page <= data.totalPages) {
      expect(data.items.length).toBeGreaterThan(0);
    } else {
      expect(data.items.length).toBe(0);
    }
  }

  validatePagination(data: ZoneWiseAtrUploadsData): void {
    expect(data.page).toBeGreaterThan(0);
    expect(data.limit).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThanOrEqual(0);
    expect(data.totalPages).toBeGreaterThanOrEqual(0);
    expect(data.items.length).toBeLessThanOrEqual(data.limit);
    if (data.total === 0) {
      expect(data.totalPages).toEqual(0);
      expect(data.items.length).toEqual(0);
      return;
    }
    expect(data.totalPages).toEqual(Math.ceil(data.total / data.limit));
  }

  validateUniqueUploadIds(data: ZoneWiseAtrUploadsData): void {
    const ids = data.items.map((item) => item.uploadId);
    expect(new Set(ids).size).toEqual(ids.length);
    ids.forEach((id) => expect(id.trim()).not.toEqual(""));
  }

  validateQueryEcho(data: ZoneWiseAtrUploadsData, query: ZoneWiseAtrUploadsQuery): void {
    expect(data.page).toEqual(query.page ?? 1);
    expect(data.limit).toEqual(query.limit ?? 10);
    const expectedMonth = Number(query.month);
    const expectedYear = Number(query.year);
    data.items.forEach((item) => {
      expect(item.month).toEqual(expectedMonth);
      expect(item.year).toEqual(expectedYear);
      if (query.status && query.status !== "--") {
        expect(item.status).toEqual(String(query.status));
      }
    });
  }

  validateStatusAllowed(data: ZoneWiseAtrUploadsData): void {
    const allowed = new Set<string>(ZONE_WISE_ATR_UPLOAD_STATUSES);
    data.items.forEach((item) => {
      expect(
        allowed.has(item.status),
        `unexpected status "${item.status}" — expected one of ${[...allowed].join(", ")}`,
      ).toBeTruthy();
    });
  }

  validateItemFields(data: ZoneWiseAtrUploadsData): void {
    data.items.forEach((item) => {
      expect(item.submissionId.trim()).not.toEqual("");
      expect(item.originalFileName.trim()).not.toEqual("");
      expect(item.mimeType.trim()).not.toEqual("");
      expect(item.fileSizeBytes).toBeGreaterThan(0);
      expect(item.uploadedByUserId.trim()).not.toEqual("");
      expect(item.uploadedByName.trim()).not.toEqual("");
      expect(item.uploadedAt.trim()).not.toEqual("");
      expect(item.totalRecords).toBeGreaterThanOrEqual(0);
      expect(item.validRecords).toBeGreaterThanOrEqual(0);
      expect(item.invalidRecords).toBeGreaterThanOrEqual(0);
      expect(item.duplicateRecords).toBeGreaterThanOrEqual(0);
      expect(item.importedRecords).toBeGreaterThanOrEqual(0);
      expect(item.failedRecords).toBeGreaterThanOrEqual(0);
    });
  }

  validateSummaryCounts(summary: ZoneWiseAtrUploadsSummary): void {
    expect(summary.uploads).toBeGreaterThanOrEqual(0);
    expect(summary.pendingApproval).toBeGreaterThanOrEqual(0);
    expect(summary.completed).toBeGreaterThanOrEqual(0);
    expect(summary.partiallyCompleted).toBeGreaterThanOrEqual(0);
    expect(summary.failed).toBeGreaterThanOrEqual(0);
    expect(summary.totalRecords).toBeGreaterThanOrEqual(0);
    expect(summary.imported).toBeGreaterThanOrEqual(0);
    expect(summary.invalid).toBeGreaterThanOrEqual(0);
    expect(summary.duplicates).toBeGreaterThanOrEqual(0);
    const statusSum =
      summary.pendingApproval + summary.completed + summary.partiallyCompleted + summary.failed;
    expect(
      statusSum,
      `status bucket sum (${statusSum}) must be <= uploads (${summary.uploads})`,
    ).toBeLessThanOrEqual(summary.uploads);
  }

  /**
   * Summary.uploads must equal unfiltered list total;
   * summary.completed must equal list total with status=COMPLETED.
   */
  validateSummaryMatchesList(
    summary: ZoneWiseAtrUploadsSummary,
    listTotalAll: number,
    listTotalCompleted: number,
  ): void {
    expect(
      summary.uploads,
      `summary.uploads (${summary.uploads}) must equal list total without status (${listTotalAll})`,
    ).toEqual(listTotalAll);
    expect(
      summary.completed,
      `summary.completed (${summary.completed}) must equal list total status=COMPLETED (${listTotalCompleted})`,
    ).toEqual(listTotalCompleted);
  }
}
