export type AtrReportType =
  | "billingEfficiencyDetails"
  | "billingEfficiencySummary"
  | "disconnectionDetails"
  | "disconnectionSummary"
  | "pfMdDetails"
  | "billingEfficiencyBaseline"
  | "aberrationsDetails"
  | "meterNonCommunicationRemarks";

export interface AtrReportQuery {
  reportType: AtrReportType | string;
  year?: number | string;
  month?: string | number;
  organisationLookupId?: number;
  networkLookupId?: number;
  page?: number;
  limit?: number;
}

export interface AtrReportColumn {
  key: string;
  header: string;
}

export interface AtrReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type AtrReportRow = Record<string, string | number> & { id: string };

export interface AtrReportData {
  columns: AtrReportColumn[];
  rows: AtrReportRow[];
  pagination: AtrReportPagination;
}

export interface AtrReportResponse {
  success: boolean;
  data?: {
    columns?: AtrReportColumn[];
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
