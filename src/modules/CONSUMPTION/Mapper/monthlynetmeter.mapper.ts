export interface MonthlyNetMeterItem {
  slNo: number;
  circle: string | null;
  division: string | null;
  subDivision: string | null;
  zone: string | null;
  feeder: string | null;
  dtr: string | null;
  name: string | null;
  address: string | null;
  ivrsNumber: string | null;
  category: string | null;
  msn: string | null;
  phase: string | null;
  subStation: string | null;
  kwh: number | null;
  kvah: number | null;
  kwhExport: number | null;
  kvahExport: number | null;
  netKwh: number | null;
  netKvah: number | null;
}

export interface MonthlyNetMeterData {
  items: MonthlyNetMeterItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MonthlyNetMeterResponse {
  success: boolean;
  data?: MonthlyNetMeterData;
  error?: {
    code?: string;
    message?: string;
  };
}

export class MonthlyNetMeterMapper {
  static map(
    response: MonthlyNetMeterResponse,
  ): MonthlyNetMeterData & { success: boolean } {
    const data = response.data ?? ({} as MonthlyNetMeterData);
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
