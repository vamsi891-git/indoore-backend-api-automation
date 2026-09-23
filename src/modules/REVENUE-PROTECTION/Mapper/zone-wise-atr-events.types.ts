export interface ZoneWiseAtrEventsQuery {
  month: number | string;
  year: number | string;
  page?: number;
  limit?: number;
}

export interface ZoneWiseAtrEventsColumn {
  key: string;
  header: string;
}

export interface ZoneWiseAtrEventsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ZoneWiseAtrEventsRow = Record<string, string | number | boolean | null> & {
  id: string;
};

export interface ZoneWiseAtrEventsData {
  columns: ZoneWiseAtrEventsColumn[];
  rows: ZoneWiseAtrEventsRow[];
  pagination: ZoneWiseAtrEventsPagination;
}

export interface ZoneWiseAtrEventsResponse {
  success: boolean;
  data?: {
    columns?: ZoneWiseAtrEventsColumn[];
    rows?: Array<Record<string, unknown>>;
    pagination?: {
      page?: number | string | null;
      limit?: number | string | null;
      total?: number | string | null;
      totalPages?: number | string | null;
    };
  };
  error?: { code?: string; message?: string };
  message?: string;
}

export interface ZoneWiseAtrEventsImportResult {
  uploadId: string;
  submissionId: string;
  status: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  skippedDuplicateRows: number;
  validRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  importedRecords: number;
  failedRecords: number;
  errors: unknown[];
}

export interface ZoneWiseAtrEventsImportResponse {
  success: boolean;
  data?: Partial<ZoneWiseAtrEventsImportResult> & Record<string, unknown>;
  error?: { code?: string; message?: string };
  message?: string;
}

export interface ZoneWiseAtrEventsImportInput {
  month: number | string;
  year: number | string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}
