import {
  mapMasterDataList,
  MasterDataList,
  MasterDataListRaw,
} from "./master-data-list.mapper";

export interface DtrMasterQuery {
  page?: number;
  limit?: number;
  q?: string;
}

export interface DtrMasterResponse {
  success: boolean;
  data?: MasterDataListRaw<DtrMasterItem>;
  error?: { code?: string; message?: string };
}

export interface DtrMasterData extends MasterDataList<DtrMasterItem> {
  columns: Array<{ key: string; header: string }>;
}

export interface DtrMasterItem {
  id: string;
  slNo: number;
  circle: string | null;
  division: string | null;
  zone: string | null;
  subStation: string | null;
  feeder: string | null;
  dtr: string;
  meterSerialNumber: string | null;
  mf: string | null;
  latitude: string | null;
  longitude: string | null;
  serviceDate: string | null;
}

export class DtrMasterMapper {
  static mapData(
    data: MasterDataListRaw<DtrMasterItem> | undefined,
    defaultLimit = 20,
  ): DtrMasterData {
    const list = mapMasterDataList(data ?? {}, defaultLimit);
    return {
      ...list,
      columns: data?.columns ?? [],
    };
  }
}
