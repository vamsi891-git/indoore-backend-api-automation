import {
  mapMasterDataList,
  MasterDataList,
  MasterDataListRaw,
} from "./master-data-list.mapper";

export interface SubstationMasterQuery {
  page?: number;
  limit?: number;
  q?: string;
}

export interface SubstationMasterResponse {
  success: boolean;
  data?: MasterDataListRaw<SubstationMasterItem>;
  error?: { code?: string; message?: string };
}

export interface SubstationMasterData extends MasterDataList<SubstationMasterItem> {
  columns: Array<{ key: string; header: string }>;
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
  static mapData(
    data: MasterDataListRaw<SubstationMasterItem> | undefined,
    defaultLimit = 20,
  ): SubstationMasterData {
    const list = mapMasterDataList(data ?? {}, defaultLimit);
    return {
      ...list,
      columns: data?.columns ?? [],
    };
  }
}
