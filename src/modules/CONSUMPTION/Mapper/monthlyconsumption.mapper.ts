export interface MonthlyReportConsumptionItem {
  slNo: number;
  division: string | null;
  zone: string | null;
  subStation: string | null;
  feeder: string | null;
  dtr: string | null;
  name: string | null;
  address: string | null;
  ivrsNumber: string | null;
  tariff: string | null;
  msn: string | null;
  phase: string | null;
  kwh: number | null;
  kvah: number | null;
  mdKw: number | null;
  mdKvah: number | null;
}

export interface MonthlyReportConsumptionData {
  items: MonthlyReportConsumptionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MonthlyReportConsumptionResponse {
  success: boolean;
  data?: MonthlyReportConsumptionData;
}

export class MonthlyReportConsumptionMapper {
  static map(
    response: MonthlyReportConsumptionResponse,
  ): MonthlyReportConsumptionData & { success: boolean } {
    const data = response.data ?? ({} as MonthlyReportConsumptionData);
    return {
      success: response.success,
      items: data.items ?? [],
      total: data.total ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? 10,
      totalPages: data.totalPages ?? 0,
    };
  }
}
