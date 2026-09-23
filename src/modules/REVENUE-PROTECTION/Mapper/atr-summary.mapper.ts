import type {
  AtrSummaryData,
  AtrSummaryResponse,
  AtrSummaryRow,
  AtrSummaryTotals,
} from "./atr-summary.types";

export type {
  AtrSummaryReportType,
  AtrSummaryHierarchyLevel,
  AtrSummaryQuery,
  AtrSummaryDetailsQuery,
  AtrSummaryColumn,
  AtrSummaryPagination,
  AtrSummaryContext,
  AtrSummaryTotals,
  AtrSummaryRow,
  AtrSummaryData,
  AtrSummaryResponse,
} from "./atr-summary.types";

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

function mapTotals(raw: Record<string, unknown> | null | undefined): AtrSummaryTotals | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return {
    totalCases: toNullableNumber(raw.totalCases),
    totalAttended: toNullableNumber(raw.totalAttended),
    pending: toNullableNumber(raw.pending),
    billedAmount: toNullableNumber(raw.billedAmount),
    recoveredAmount: toNullableNumber(raw.recoveredAmount),
    billingEfficiency: toNullableNumber(raw.billingEfficiency),
    unitsGain: toNullableNumber(raw.unitsGain),
    revenueGain: toNullableNumber(raw.revenueGain),
  };
}

export class AtrSummaryMapper {
  static mapData(raw: AtrSummaryResponse["data"] | undefined): AtrSummaryData {
    const pagination = raw?.pagination ?? {};
    const context = raw?.context ?? {};
    return {
      columns: Array.isArray(raw?.columns) ? raw!.columns : [],
      pagination: {
        page: toNumber(pagination.page, 1),
        limit: toNumber(pagination.limit, 20),
        total: toNumber(pagination.total, 0),
        totalPages: toNumber(pagination.totalPages, 0),
      },
      context: {
        reportType: toText(context.reportType),
        level: toText(context.level),
        parentId:
          context.parentId === null || context.parentId === undefined
            ? null
            : toText(context.parentId),
      },
      totals: mapTotals(raw?.totals as Record<string, unknown> | null | undefined),
      rows: (raw?.rows ?? []).map((row) => {
        const mapped: AtrSummaryRow = { id: toText(row.id).trim() };
        for (const [key, value] of Object.entries(row)) {
          if (key === "id") {
            continue;
          }
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
}
