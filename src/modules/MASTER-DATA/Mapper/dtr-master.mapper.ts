import {
  mapMasterDataList,
  MasterDataList,
  MasterDataListRaw,
} from "./master-data-list.mapper";

export interface DtrMasterResponse {
  success: boolean;
  data: MasterDataListRaw<DtrMasterItem>;
}

export type DtrMasterData = MasterDataList<DtrMasterItem>;

export interface DtrMasterItem {
  slNo: number;
  dtrCode: string;
  dtrName: string;
  meterSerialNumber: string | null;
  latitude: string | null;
  longitude: string | null;
}

export class DtrMasterMapper {
  static mapData(data: MasterDataListRaw<DtrMasterItem>): DtrMasterData {
    return mapMasterDataList(data);
  }
}
