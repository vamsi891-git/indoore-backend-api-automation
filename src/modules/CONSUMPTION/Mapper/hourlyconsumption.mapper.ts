export interface HourlyConsumptionItem {
  slNo: number;
  division: string | null;
  zone: string | null;
  subStation: string | null;
  feeder: string | null;
  dtr: string | null;
  name: string | null;
  ivrsNumber: string | null;
  msn: string | null;
  phase: string | null;
  h1: number | null;
  h2: number | null;
  h3: number | null;
  h4: number | null;
  h5: number | null;
  h6: number | null;
  h7: number | null;
  h8: number | null;
  h9: number | null;
  h10: number | null;
  h11: number | null;
  h12: number | null;
  h13: number | null;
  h14: number | null;
  h15: number | null;
  h16: number | null;
  h17: number | null;
  h18: number | null;
  h19: number | null;
  h20: number | null;
  h21: number | null;
  h22: number | null;
  h23: number | null;
  h24: number | null;
  hourlyKwh: number | null;
}
export interface HourlyConsumptionData {
  items: HourlyConsumptionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface HourlyConsumptionResponse {
  success: boolean;
  data?: HourlyConsumptionData;
}
export class HourlyConsumptionMapper {
  static map(response: HourlyConsumptionResponse,): HourlyConsumptionData & { success: boolean } {
    const data = response.data ?? ({} as HourlyConsumptionData);
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
