export interface PatternConsumptionPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
export interface PatternConsumptionTable {
  title: string;
  columns: Array<{ key: string; label: string }>;
  rows: Record<string, unknown>[];
  pagination?: PatternConsumptionPagination;
}
export interface PatternConsumptionResponse {
  success: boolean;
  data?: {
    table?: PatternConsumptionTable;
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
    return {
      success: response.success,
      title: table.title ?? "",
      columns: table.columns ?? [],
      rows: table.rows ?? [],
      pagination: table.pagination ?? {
        page: 1,
        pageSize: table.rows.length,
        totalCount: table.rows.length,
        totalPages: table.rows.length > 0 ? 1 : 0,
      },
    };
  }
}
