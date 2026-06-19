import {
  mapMasterDataList,
  MasterDataList,
  MasterDataListRaw,
} from "./master-data-list.mapper";

export interface FeederMasterQuery {
  page?: number;
  limit?: number;
  q?: string;
}

export interface FeederMasterResponse {
  success: boolean;
  data?: MasterDataListRaw<FeederMasterItem>;
  error?: { code?: string; message?: string };
}

export interface FeederMasterData extends MasterDataList<FeederMasterItem> {
  columns: Array<{ key: string; header: string }>;
}

export interface FeederMasterItem {
  slNo: number;
  discomName: string | null;
  regionName: string | null;
  circleName: string | null;
  divisionName: string | null;
  zoneName: string | null;
  substationName: string | null;
  feederName: string;
  dtrCount: number;
  consumerCount: number;
}

export class FeederMasterMapper {
  static mapData(
    data: MasterDataListRaw<FeederMasterItem> | undefined,
    defaultLimit = 20,
  ): FeederMasterData {
    const list = mapMasterDataList(data ?? {}, defaultLimit);
    return {
      ...list,
      columns: data?.columns ?? [],
    };
  }
}
