export interface DtrMasterResponse {
  success: boolean;
  data: DtrMasterData;
}
export interface DtrMasterData {
  items: DtrMasterItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface DtrMasterItem {
  slNo: number;
  dtrCode: string;
  dtrName: string;
  meterSerialNumber: string | null;
  latitude: string | null;
  longitude: string | null;
}
export class DtrMasterMapper {
  static mapData(data: DtrMasterData): DtrMasterData {
    return {
      items: data.items ?? [],
      total: data.total ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? 20,
      totalPages: data.totalPages ?? 0,
    };
  }
}
