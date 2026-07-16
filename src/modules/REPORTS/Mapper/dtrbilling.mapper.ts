export interface DtrBillingColumn {
  key: string;
  header: string;
}

export interface DtrBillingPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DtrBillingRow {
  id?: string;
  slNo: number;
  circle: string;
  division: string;
  zone: string;
  subStation: string;
  feeder: string;
  dtr: string;
  meterSerialNumber: string;
  meterTime: string;
  billingDate: string;
  kwhImp: string;
  kwhExp: string;
  kvahImp: string;
  kvahExp: string;
  kwImp: string;
  kwDateTime: string | null;
  kvaImp: string;
  kvaDateTime: string | null;
  mf: string;
}

export interface DtrBillingReportData {
  columns: DtrBillingColumn[];
  rows: DtrBillingRow[];
  pagination: DtrBillingPagination;
}

export interface DtrBillingResponse {
  success: boolean;
  data: DtrBillingReportData;
}

const EMPTY_PAGINATION: DtrBillingPagination = {
  page: 1,
  limit: 0,
  total: 0,
  totalPages: 0,
};

export class DtrBillingMapper {
  static map(response: any): DtrBillingResponse {
    const data = response.data ?? {};
    const pagination = data.pagination ?? EMPTY_PAGINATION;

    return {
      success: response.success,
      data: {
        columns: data.columns ?? [],
        rows: data.rows ?? [],
        pagination: {
          page: Number(pagination.page ?? 1),
          limit: Number(pagination.limit ?? 0),
          total: Number(pagination.total ?? 0),
          totalPages: Number(pagination.totalPages ?? 0),
        },
      },
    };
  }
}
