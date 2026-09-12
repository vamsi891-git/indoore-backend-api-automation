export const currentWithoutVoltageColumnKeys = [
  "slNo",
  "circle",
  "division",
  "zone",
  "subStation",
  "feeder",
  "dtr",
  "sanctionedLoadKw",
  "name",
  "address",
  "ivrsNumber",
  "category",
  "meterSerialNumber",
  "phase",
  "rCurrent",
  "rnVoltage",
  "nightKwh",
  "dayKwh",
  "meterReadingDateTime",
] as const;

export type CurrentWithoutVoltageColumnKey =
  (typeof currentWithoutVoltageColumnKeys)[number];

export interface CurrentWithoutVoltageColumn {
  key: string;
  header: string;
}

export interface CurrentWithoutVoltageRow {
  id: string;
  slNo: number;
  circle: string;
  division: string;
  zone: string;
  subStation: string;
  feeder: string;
  dtr: string;
  sanctionedLoadKw: string | number;
  name: string;
  address: string;
  ivrsNumber: string;
  category: string;
  meterSerialNumber: string;
  phase: string;
  rCurrent: string;
  rnVoltage: string;
  nightKwh: string;
  dayKwh: string;
  meterReadingDateTime: string;
}

export interface CurrentWithoutVoltagePagination {
  page: number;
  limit: number;
  total: number | null;
  totalPages: number | null;
  totalIsExact?: boolean | null;
  hasMore?: boolean | null;
  nextCursor?: string | null;
}

export interface CurrentWithoutVoltageDataModel {
  columns: CurrentWithoutVoltageColumn[];
  rows: CurrentWithoutVoltageRow[];
  pagination: CurrentWithoutVoltagePagination;
}

export interface CurrentWithoutVoltageErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface CurrentWithoutVoltageResponse {
  success: boolean;
  data?: CurrentWithoutVoltageDataModel | null;
  message?: string;
  error?: CurrentWithoutVoltageErrorBody["error"];
}

export interface MappedCurrentWithoutVoltage {
  success: boolean;
  columns: CurrentWithoutVoltageColumn[];
  rows: CurrentWithoutVoltageRow[];
  pagination: CurrentWithoutVoltagePagination;
}

export type CurrentWithoutVoltageScenario =
  | "dev_live_primary"
  | "dev_live_phase_y"
  | "dev_live_phase_b"
  | "dev_live_page_beyond"
  | "dev_limit_one"
  | "dev_ignore_unknown_query"
  | "dev_missing_phase_defaults"
  | "contract_live_full"
  | "contract_empty_page"
  | "invalid_phase"
  | "invalid_month"
  | "missing_year"
  | "missing_month"
  | "invalid_page"
  | "invalid_limit";

const EMPTY_PAGINATION: CurrentWithoutVoltagePagination = {
  page: 1,
  limit: 10,
  total: null,
  totalPages: null,
  totalIsExact: null,
  hasMore: null,
  nextCursor: null,
};

export class CurrentWithoutVoltageMapper {
  static map(
    response: CurrentWithoutVoltageResponse,
  ): MappedCurrentWithoutVoltage {
    const data = response.data ?? ({} as CurrentWithoutVoltageDataModel);
    const pagination = data.pagination ?? EMPTY_PAGINATION;

    return {
      success: response.success,
      columns: data.columns ?? [],
      rows: data.rows ?? [],
      pagination: {
        page: Number(pagination.page ?? 1),
        limit: Number(pagination.limit ?? 10),
        total:
          pagination.total === null || pagination.total === undefined
            ? null
            : Number(pagination.total),
        totalPages:
          pagination.totalPages === null || pagination.totalPages === undefined
            ? null
            : Number(pagination.totalPages),
        totalIsExact:
          pagination.totalIsExact === undefined
            ? null
            : Boolean(pagination.totalIsExact),
        hasMore:
          pagination.hasMore === undefined ? null : Boolean(pagination.hasMore),
        nextCursor:
          pagination.nextCursor === undefined ? null : pagination.nextCursor,
      },
    };
  }
}
