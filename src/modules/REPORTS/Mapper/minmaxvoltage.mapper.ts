export const minMaxVoltageColumnKeys = [
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
  "voltage",
  "meterReadingDateTime",
] as const;

export type MinMaxVoltageColumnKey = (typeof minMaxVoltageColumnKeys)[number];

export interface MinMaxVoltageColumn {
  key: string;
  header: string;
}

export interface MinMaxVoltageRow {
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
  voltage: string;
  meterReadingDateTime: string;
}

export interface MinMaxVoltagePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  totalIsExact?: boolean | null;
  hasMore?: boolean | null;
  nextCursor?: string | null;
}

export interface MinMaxVoltageDataModel {
  columns: MinMaxVoltageColumn[];
  rows: MinMaxVoltageRow[];
  pagination: MinMaxVoltagePagination;
}

export interface MinMaxVoltageErrorBody {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface MinMaxVoltageResponse {
  success: boolean;
  data?: MinMaxVoltageDataModel | null;
  message?: string;
  error?: MinMaxVoltageErrorBody["error"];
}

export interface MappedMinMaxVoltage {
  success: boolean;
  columns: MinMaxVoltageColumn[];
  rows: MinMaxVoltageRow[];
  pagination: MinMaxVoltagePagination;
}

export type MinMaxVoltageScenario =
  | "dev_live_primary"
  | "dev_live_min_y"
  | "dev_live_min_b"
  | "dev_live_max_r"
  | "dev_live_max_y"
  | "dev_live_max_b"
  | "dev_live_page_beyond"
  | "dev_limit_one"
  | "dev_ignore_unknown_query"
  | "contract_live_full"
  | "contract_empty_page"
  | "invalid_voltage_type"
  | "invalid_phase"
  | "invalid_month"
  | "missing_year"
  | "missing_month"
  | "missing_meter_phase"
  | "invalid_page"
  | "invalid_limit";

const EMPTY_PAGINATION: MinMaxVoltagePagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  totalIsExact: null,
  hasMore: null,
  nextCursor: null,
};

export class MinMaxVoltageMapper {
  static map(response: MinMaxVoltageResponse): MappedMinMaxVoltage {
    const data = response.data ?? ({} as MinMaxVoltageDataModel);
    const pagination = data.pagination ?? EMPTY_PAGINATION;

    return {
      success: response.success,
      columns: data.columns ?? [],
      rows: data.rows ?? [],
      pagination: {
        page: Number(pagination.page ?? 1),
        limit: Number(pagination.limit ?? 10),
        total: Number(pagination.total ?? 0),
        totalPages: Number(pagination.totalPages ?? 0),
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
