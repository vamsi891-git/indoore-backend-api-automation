export type AtrSummaryReportType = "billingEfficiency" | "disconnectionSummary" | "aberration";

export type AtrSummaryHierarchyLevel = "circle" | "division" | "zone" | "feeder" | "dtr";

export interface AtrSummaryQuery {
  year: number | string;
  reportType: AtrSummaryReportType | string;
  hierarchyLevel: AtrSummaryHierarchyLevel | string;
  month?: number | string;
  parentId?: number | string;
  circleId?: number | string;
  divisionId?: number | string;
  zoneId?: number | string;
  feederId?: number | string;
  page?: number;
  limit?: number;
}

/** Details list/export — aberration only; no hierarchyLevel required. */
export interface AtrSummaryDetailsQuery {
  year: number | string;
  reportType: AtrSummaryReportType | string;
  month?: number | string;
  parentId?: number | string;
  circleId?: number | string;
  divisionId?: number | string;
  zoneId?: number | string;
  feederId?: number | string;
  page?: number;
  limit?: number;
}

export interface AtrSummaryColumn {
  key: string;
  header: string;
}

export interface AtrSummaryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AtrSummaryContext {
  reportType: string;
  level: string;
  parentId: string | null;
}

export interface AtrSummaryTotals {
  totalCases: number | null;
  totalAttended: number | null;
  pending: number | null;
  billedAmount: number | null;
  recoveredAmount: number | null;
  billingEfficiency: number | null;
  unitsGain: number | null;
  revenueGain: number | null;
}

export type AtrSummaryRow = Record<string, string | number | boolean | null> & {
  id: string;
};

export interface AtrSummaryData {
  columns: AtrSummaryColumn[];
  rows: AtrSummaryRow[];
  pagination: AtrSummaryPagination;
  context: AtrSummaryContext;
  totals: AtrSummaryTotals | null;
}

export interface AtrSummaryResponse {
  success: boolean;
  data?: {
    columns?: AtrSummaryColumn[];
    rows?: Array<Record<string, unknown>>;
    pagination?: {
      page?: number | string | null;
      limit?: number | string | null;
      total?: number | string | null;
      totalPages?: number | string | null;
    };
    context?: {
      reportType?: string | null;
      level?: string | null;
      parentId?: string | number | null;
    };
    totals?: Record<string, unknown> | null;
  };
  error?: { code?: string; message?: string };
  message?: string;
}
