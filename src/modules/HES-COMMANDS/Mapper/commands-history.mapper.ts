export interface CommandsHistoryRow {
  sno: number;
  /** Job/request identifier — API returns string (may exceed MAX_SAFE_INTEGER). */
  requestId: string;
  requestedBy: string;
  commandName: string;
  selectedMeter: string;
  selectionType: string;
  requestedTime: string;
  status: string;
  reason: string | null;
}

export interface CommandsHistoryPagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CommandsHistoryResponse {
  success: boolean;
  message?: string;
  data?: CommandsHistoryRow[];
  pagination?: CommandsHistoryPagination;
  error?: { code: string; message: string };
}

export interface CommandsHistoryData {
  rows: CommandsHistoryRow[];
  pagination: CommandsHistoryPagination;
  message: string;
}

export class CommandsHistoryMapper {
  static mapResponse(body: CommandsHistoryResponse): CommandsHistoryData {
    if (!body.success || !body.data || !body.pagination) {
      throw new Error("Cannot map unsuccessful commands history response");
    }

    return {
      message: body.message?.trim() ?? "",
      rows: body.data.map((row) => ({
        sno: row.sno,
        requestId: String(row.requestId).trim(),
        requestedBy: row.requestedBy.trim(),
        commandName: row.commandName.trim(),
        selectedMeter: row.selectedMeter.trim(),
        selectionType: row.selectionType.trim(),
        requestedTime: row.requestedTime.trim(),
        status: row.status.trim(),
        reason: row.reason?.trim() ?? null,
      })),
      pagination: body.pagination,
    };
  }
}
