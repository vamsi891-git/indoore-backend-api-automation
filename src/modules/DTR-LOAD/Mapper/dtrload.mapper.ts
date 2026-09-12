import type { DtrLoadRow, ParsedDtrLoadResponse } from "../schemas/dtrload.schemas";
import { DtrLoadResponseSchema } from "../schemas/dtrload.schemas";

export type { DtrLoadRow };

export interface DtrLoadResponse {
  success: boolean;
  data: DtrLoadPayload;
}

export interface DtrLoadPayload {
  columns: Array<{ key: string; header: string }>;
  rows: DtrLoadRow[];
  page: number;
  limit: number;
  total: number | null;
  totalPages: number | null;
}

export class DtrLoadMapper {
  static parse(body: unknown): ParsedDtrLoadResponse {
    return DtrLoadResponseSchema.parse(body);
  }

  static map(parsed: ParsedDtrLoadResponse["data"]): DtrLoadPayload {
    return {
      columns: parsed.columns,
      rows: parsed.rows,
      page: parsed.pagination.page,
      limit: parsed.pagination.limit,
      total: parsed.pagination.total,
      totalPages: parsed.pagination.totalPages,
    };
  }
}
