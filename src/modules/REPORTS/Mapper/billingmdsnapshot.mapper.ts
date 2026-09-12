export interface BillingMdSnapshotColumn {
  key: string;
  header: string;
}

/**
 * Hierarchy / consumer fields may be null when meter is not linked.
 * `meterLookupTblRefId` is on the row but not in the column grid.
 */
export interface BillingMdSnapshotRow {
  id: string;
  slNo: number;
  circle: string | null;
  division: string | null;
  zone: string | null;
  substation: string | null;
  feeder: string | null;
  dtr: string | null;
  consumerName: string | null;
  ivrsNumber: string | null;
  meterNumber: string;
  meterLookupTblRefId: number | null;
  phase: string | null;
  tariff: string | null;
  sanctionedLoadKw: number | string | null;
  meterTimestamp: string;
  mdKw: number | string | null;
  mdKwOt: string | null;
  mdKva: number | string | null;
  mdKvaOt: string | null;
  pf: number | string | null;
  kwhC: number | string | null;
  kvahC: number | string | null;
  [key: string]: string | number | null | undefined;
}

export interface BillingMdSnapshotPagination {
  page: number;
  limit: number;
  /**
   * Live Oct 2025 with includeTotal=false returned total=0 while rows exist.
   * Treat zero total with rows as valid (not “no data”).
   */
  total: number | null;
  totalPages: number | null;
  totalIsExact?: boolean | null;
  hasMore?: boolean | null;
}

export interface BillingMdSnapshotDataModel {
  columns: BillingMdSnapshotColumn[];
  rows: BillingMdSnapshotRow[];
  pagination: BillingMdSnapshotPagination;
}

export interface BillingMdSnapshotErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface BillingMdSnapshotResponse {
  success: boolean;
  data?: BillingMdSnapshotDataModel | null;
  message?: string;
  error?: BillingMdSnapshotErrorBody["error"];
}

export interface MappedBillingMdSnapshot {
  success: boolean;
  columns: BillingMdSnapshotColumn[];
  rows: BillingMdSnapshotRow[];
  pagination: BillingMdSnapshotPagination;
}

export type BillingMdSnapshotScenario =
  | "dev_live_without_total"
  | "dev_live_include_total"
  | "dev_live_page_beyond"
  | "dev_limit_one"
  | "dev_ignore_unknown_query"
  | "contract_live_oct_2025"
  | "contract_sparse_hierarchy"
  | "contract_empty_page"
  | "invalid_month"
  | "invalid_year"
  | "missing_year"
  | "missing_month"
  | "invalid_page"
  | "invalid_limit";

export const billingMdSnapshotColumnKeys = [
  "slNo",
  "circle",
  "division",
  "zone",
  "substation",
  "feeder",
  "dtr",
  "consumerName",
  "ivrsNumber",
  "meterNumber",
  "phase",
  "tariff",
  "sanctionedLoadKw",
  "meterTimestamp",
  "mdKw",
  "mdKwOt",
  "mdKva",
  "mdKvaOt",
  "pf",
  "kwhC",
  "kvahC",
] as const;

const EMPTY_PAGINATION: BillingMdSnapshotPagination = {
  page: 1,
  limit: 10,
  total: null,
  totalPages: null,
  totalIsExact: null,
  hasMore: null,
};

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export class BillingMdSnapshotMapper {
  static map(response: BillingMdSnapshotResponse): MappedBillingMdSnapshot {
    const data = response.data ?? ({} as BillingMdSnapshotDataModel);
    const pagination = data.pagination ?? EMPTY_PAGINATION;

    return {
      success: response.success,
      columns: data.columns ?? [],
      rows: (data.rows ?? []).map((row) => ({
        ...row,
        meterLookupTblRefId: nullableNumber(row.meterLookupTblRefId),
        sanctionedLoadKw: nullableNumber(row.sanctionedLoadKw),
        mdKw: nullableNumber(row.mdKw),
        mdKva: nullableNumber(row.mdKva),
        pf: nullableNumber(row.pf),
        kwhC: nullableNumber(row.kwhC),
        kvahC: nullableNumber(row.kvahC),
      })) as BillingMdSnapshotRow[],
      pagination: {
        page: Number(pagination.page ?? 1),
        limit: Number(pagination.limit ?? 10),
        total: nullableNumber(pagination.total),
        totalPages: nullableNumber(pagination.totalPages),
        totalIsExact:
          pagination.totalIsExact === undefined
            ? null
            : Boolean(pagination.totalIsExact),
        hasMore:
          pagination.hasMore === undefined ? null : Boolean(pagination.hasMore),
      },
    };
  }
}
