export interface MonthlyNetMeterItem {
  slNo: number;
  circle: string;
  division: string;
  subDivision: string;
  zone: string;
  feeder: string;
  dtr: string;
  name: string;
  address: string | null;
  ivrsNumber: string;
  category: string | null;
  msn: string;
  phase: string;
  subStation: string;
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
      limit: data.limit ?? 30,
      totalPages: data.totalPages ?? 0,
    };
  }
}
