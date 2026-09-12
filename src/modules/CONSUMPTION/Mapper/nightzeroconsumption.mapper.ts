export interface NightZeroConsumptionItem {
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
  tariff: string | null;
  msn: string | null;
  phase: string | null;
  mf: number | null;
  nightKwh: number | null;
  dayKwh: number | null;
  totalKwh: number | null;
  eventCount: number | null;
  durationMinutes: number | null;
}

export interface NightZeroConsumptionData {
  items: NightZeroConsumptionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NightZeroConsumptionResponse {
  success: boolean;
  data?: NightZeroConsumptionData;
}

export class NightZeroConsumptionMapper {
  static map(
    response: NightZeroConsumptionResponse,
  ): NightZeroConsumptionData & { success: boolean } {
    const data = response.data ?? ({} as NightZeroConsumptionData);
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
