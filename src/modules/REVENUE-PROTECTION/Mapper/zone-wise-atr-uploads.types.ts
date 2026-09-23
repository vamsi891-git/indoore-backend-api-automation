export type ZoneWiseAtrUploadStatus =
  | "PENDING_APPROVAL"
  | "PROCESSING"
  | "VALIDATION_FAILED"
  | "COMPLETED"
  | "PARTIALLY_COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface ZoneWiseAtrUploadsQuery {
  month: number | string;
  year: number | string;
  status?: ZoneWiseAtrUploadStatus | string;
  page?: number;
  limit?: number;
}

export interface ZoneWiseAtrUploadItem {
  uploadId: string;
  submissionId: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  hasOriginalFile: boolean;
  month: number;
  year: number;
  uploadedByUserId: string;
  uploadedByName: string;
  uploadedAt: string;
  organisationLookupId: number | string | null;
  networkLookupId: number | string | null;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  importedRecords: number;
  failedRecords: number;
  status: string;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  processingDurationMs: number | null;
}

export interface ZoneWiseAtrUploadsData {
  items: ZoneWiseAtrUploadItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ZoneWiseAtrUploadsResponse {
  success: boolean;
  data?: {
    items?: Array<Record<string, unknown>>;
    page?: number | string | null;
    limit?: number | string | null;
    total?: number | string | null;
    totalPages?: number | string | null;
  };
  error?: { code?: string; message?: string };
  message?: string;
}

export interface ZoneWiseAtrUploadsSummaryQuery {
  month: number | string;
  year: number | string;
}

export interface ZoneWiseAtrUploadsSummary {
  uploads: number;
  pendingApproval: number;
  completed: number;
  partiallyCompleted: number;
  failed: number;
  totalRecords: number;
  imported: number;
  invalid: number;
  duplicates: number;
}

export interface ZoneWiseAtrUploadsSummaryResponse {
  success: boolean;
  data?: Partial<ZoneWiseAtrUploadsSummary> & Record<string, unknown>;
  error?: { code?: string; message?: string };
  message?: string;
}
