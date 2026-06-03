// Mapper/substation-master.mapper.ts
export interface SubstationMasterResponse {
  success: boolean;
  data: SubstationMasterData;
}
export interface SubstationMasterData {
  items: SubstationMasterItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface SubstationMasterItem {
  slNo: number;
  discomName: string | null;
  regionName: string | null;
  circleName: string | null;
  divisionName: string | null;
  zoneName: string | null;
  substationName: string;
  substationCode: string | null;
  dtrCount: number;
  consumerCount: number;
}
export class SubstationMasterMapper {
  static mapData(data: SubstationMasterData): SubstationMasterData {
    return {
      items: data.items ?? [],
      total: data.total ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? 20,
      totalPages: data.totalPages ?? 0,
    };
  }
}
