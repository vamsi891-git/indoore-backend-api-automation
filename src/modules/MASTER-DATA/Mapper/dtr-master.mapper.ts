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
  static mapData(data: MasterDataListRaw<DtrMasterItem>): DtrMasterData {
    return mapMasterDataList(data);
  }
}
