export type HourlyLossHierarchyType = "dtr" | "feeder";

export interface HourlyLossReportColumn {
  key: string;
  header: string;
}

export type HourlyBucketKey =
  | "H1"
  | "H2"
  | "H3"
  | "H4"
  | "H5"
  | "H6"
  | "H7"
  | "H8"
  | "H9"
  | "H10"
  | "H11"
  | "H12"
  | "H13"
  | "H14"
  | "H15"
  | "H16"
  | "H17"
  | "H18"
  | "H19"
  | "H20"
  | "H21"
  | "H22"
  | "H23"
  | "H24";

export const HOURLY_BUCKET_KEYS: HourlyBucketKey[] = [
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "H7",
  "H8",
  "H9",
  "H10",
  "H11",
  "H12",
  "H13",
  "H14",
  "H15",
  "H16",
  "H17",
  "H18",
  "H19",
  "H20",
  "H21",
  "H22",
  "H23",
  "H24",
];

export const HOURLY_LOSS_COLUMN_KEYS = [
  "rowKind",
  "circle",
  "division",
  "zone",
  "substation",
  "feeder",
  "dtrName",
  "dtrMeterSerialNumber",
  "consumerName",
  "meterSerialNumber",
  "mf",
  ...HOURLY_BUCKET_KEYS,
  "total",
] as const;

export interface HourlyLossReportRow {
  id?: string;
  rowKind: string;
  circle: string | null;
  division: string | null;
  zone: string | null;
  substation: string | null;
  feeder: string | null;
  dtrName: string | null;
  dtrMeterSerialNumber: string | null;
  consumerName: string | null;
  meterSerialNumber: string | null;
  mf: string | number | null;
  H1: number;
  H2: number;
  H3: number;
  H4: number;
  H5: number;
  H6: number;
  H7: number;
  H8: number;
  H9: number;
  H10: number;
  H11: number;
  H12: number;
  H13: number;
  H14: number;
  H15: number;
  H16: number;
  H17: number;
  H18: number;
  H19: number;
  H20: number;
  H21: number;
  H22: number;
  H23: number;
  H24: number;
  total: number;
}

export interface HourlyLossReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface HourlyLossReportGridData {
  columns: HourlyLossReportColumn[];
  rows: HourlyLossReportRow[];
  pagination: HourlyLossReportPagination;
}

export interface HourlyLossReportResponse {
  success: boolean;
  data: HourlyLossReportGridData;
}

export interface HourlyLossReportQuery {
  hierarchyType: HourlyLossHierarchyType;
  networkLookupId: number;
  fromDate: string;
  toDate: string;
  page: number;
  limit: number;
}

export interface HourlyLossReportPaginatedView {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  rows: HourlyLossReportRow[];
  columns: HourlyLossReportColumn[];
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toHourlyNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function mapHourlyLossReportRows(
  response: HourlyLossReportResponse,
): HourlyLossReportRow[] {
  return (response.data?.rows ?? []).map((row) => {
    const mapped = {
      ...row,
      rowKind: String(row.rowKind ?? "").trim(),
      circle: toNullableString(row.circle),
      division: toNullableString(row.division),
      zone: toNullableString(row.zone),
      substation: toNullableString(row.substation),
      feeder: toNullableString(row.feeder),
      dtrName: toNullableString(row.dtrName),
      dtrMeterSerialNumber: toNullableString(row.dtrMeterSerialNumber),
      consumerName: toNullableString(row.consumerName),
      meterSerialNumber: toNullableString(row.meterSerialNumber),
      mf: row.mf ?? null,
      total: toHourlyNumber(row.total),
      id: row.id == null ? undefined : String(row.id).trim(),
    } as HourlyLossReportRow;

    for (const key of HOURLY_BUCKET_KEYS) {
      mapped[key] = toHourlyNumber(row[key]);
    }

    return mapped;
  });
}

export function getHourlyBucketValues(row: HourlyLossReportRow): number[] {
  return HOURLY_BUCKET_KEYS.map((key) => row[key]);
}

export function getHourlyLossReportPaginatedView(
  response: HourlyLossReportResponse,
  query: Pick<HourlyLossReportQuery, "page" | "limit">,
): HourlyLossReportPaginatedView {
  const { pagination, columns } = response.data;
  return {
    page: pagination?.page ?? query.page,
    pageSize: pagination?.limit ?? query.limit,
    totalCount: pagination?.total ?? 0,
    totalPages: pagination?.totalPages ?? 0,
    rows: mapHourlyLossReportRows(response),
    columns: columns ?? [],
  };
}
