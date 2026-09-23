import type {
  ZoneWiseAtrEventsData,
  ZoneWiseAtrEventsImportResponse,
  ZoneWiseAtrEventsImportResult,
  ZoneWiseAtrEventsResponse,
  ZoneWiseAtrEventsRow,
} from "./zone-wise-atr-events.types";

export type {
  ZoneWiseAtrEventsQuery,
  ZoneWiseAtrEventsColumn,
  ZoneWiseAtrEventsPagination,
  ZoneWiseAtrEventsRow,
  ZoneWiseAtrEventsData,
  ZoneWiseAtrEventsResponse,
  ZoneWiseAtrEventsImportResult,
  ZoneWiseAtrEventsImportResponse,
  ZoneWiseAtrEventsImportInput,
} from "./zone-wise-atr-events.types";

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

export class ZoneWiseAtrEventsMapper {
  static mapData(raw: ZoneWiseAtrEventsResponse["data"] | undefined): ZoneWiseAtrEventsData {
    const pagination = raw?.pagination ?? {};
    return {
      columns: Array.isArray(raw?.columns) ? raw!.columns : [],
      pagination: {
        page: toNumber(pagination.page, 1),
        limit: toNumber(pagination.limit, 20),
        total: toNumber(pagination.total, 0),
        totalPages: toNumber(pagination.totalPages, 0),
      },
      rows: (raw?.rows ?? []).map((row) => {
        const mapped: ZoneWiseAtrEventsRow = { id: toText(row.id).trim() };
        for (const [key, value] of Object.entries(row)) {
          if (key === "id") continue;
          if (typeof value === "boolean") {
            mapped[key] = value;
          } else if (typeof value === "number") {
            mapped[key] = Number.isFinite(value) ? value : 0;
          } else if (value === null || value === undefined) {
            mapped[key] = null;
          } else {
            mapped[key] = toText(value);
          }
        }
        return mapped;
      }),
    };
  }

  static mapImport(
    raw: ZoneWiseAtrEventsImportResponse["data"] | undefined,
  ): ZoneWiseAtrEventsImportResult {
    return {
      uploadId: toText(raw?.uploadId),
      submissionId: toText(raw?.submissionId),
      status: toText(raw?.status),
      totalRows: toNumber(raw?.totalRows),
      successfulRows: toNumber(raw?.successfulRows),
      failedRows: toNumber(raw?.failedRows),
      skippedDuplicateRows: toNumber(raw?.skippedDuplicateRows),
      validRecords: toNumber(raw?.validRecords),
      invalidRecords: toNumber(raw?.invalidRecords),
      duplicateRecords: toNumber(raw?.duplicateRecords),
      importedRecords: toNumber(raw?.importedRecords),
      failedRecords: toNumber(raw?.failedRecords),
      errors: Array.isArray(raw?.errors) ? (raw!.errors as unknown[]) : [],
    };
  }
}
