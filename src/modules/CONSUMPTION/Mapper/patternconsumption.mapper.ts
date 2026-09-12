export interface PatternConsumptionPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
export interface PatternConsumptionColumn {
  key: string;
  label: string;
  header?: string;
}

export interface PatternConsumptionTable {
  title: string;
  columns: PatternConsumptionColumn[];
  rows: Record<string, unknown>[];
  pagination?: PatternConsumptionPagination;
}
export interface PatternConsumptionResponse {
  success: boolean;
  data?: {
    table?: {
      title?: string;
      columns?: Array<{ key: string; label?: string; header?: string }>;
      rows?: Record<string, unknown>[];
      pagination?: PatternConsumptionPagination;
    };
  };
}
const EMPTY_TABLE: PatternConsumptionTable = {
  title: "",
  columns: [],
  rows: [],
};
export class PatternConsumptionMapper {
  static map(response: PatternConsumptionResponse) {
    const table = response.data?.table ?? EMPTY_TABLE;
    // `table.rows` is optional in the response contract; normalize once.
    const rows = table.rows ?? [];
    const columns = (table.columns ?? []).map((column) => ({
      key: column.key,
      label: column.label ?? column.header ?? "",
      header: column.header ?? column.label,
    }));

    return {
      success: response.success,
      title: table.title ?? "",
      columns,
      rows,
      pagination: table.pagination ?? {
        page: 1,
        pageSize: rows.length,
        totalCount: rows.length,
        totalPages: rows.length > 0 ? 1 : 0,
      },
    };
  }
}
