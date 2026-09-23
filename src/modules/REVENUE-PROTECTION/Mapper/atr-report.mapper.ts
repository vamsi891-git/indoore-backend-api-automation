import type { AtrReportData, AtrReportResponse, AtrReportRow } from "./atr-report.types";

export type {
  AtrReportType,
  AtrReportQuery,
  AtrReportColumn,
  AtrReportPagination,
  AtrReportRow,
  AtrReportData,
  AtrReportResponse,
} from "./atr-report.types";

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

export class AtrReportMapper {
  static mapData(raw: AtrReportResponse["data"] | undefined): AtrReportData {
    const pagination = raw?.pagination ?? {};
    return {
      columns: Array.isArray(raw?.columns) ? raw!.columns : [],
      pagination: {
        page: toNumber(pagination.page, 1),
        limit: toNumber(pagination.limit, 10),
        total: toNumber(pagination.total, 0),
        totalPages: toNumber(pagination.totalPages, 0),
      },
      rows: (raw?.rows ?? []).map((row) => {
        const mapped: AtrReportRow = { id: toText(row.id).trim() };
        for (const [key, value] of Object.entries(row)) {
          if (key === "id") {
            continue;
          }
          if (typeof value === "number") {
            mapped[key] = Number.isFinite(value) ? value : 0;
          } else if (value === null || value === undefined) {
            mapped[key] = "";
          } else if (
            typeof value === "string" &&
            value.trim() !== "" &&
            Number.isFinite(Number(value)) &&
            /^-?\d+(\.\d+)?$/.test(value.trim())
          ) {
            mapped[key] = Number(value);
          } else {
            mapped[key] = toText(value);
          }
        }
        return mapped;
      }),
    };
  }
}
