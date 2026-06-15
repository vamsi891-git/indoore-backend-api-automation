// Mapper/substation-master.mapper.ts
import {
  mapMasterDataList,
  MasterDataList,
  MasterDataListRaw,
} from "./master-data-list.mapper";

export interface SubstationMasterResponse {
  success: boolean;
  data: MasterDataListRaw<SubstationMasterItem>;
}

export type SubstationMasterData = MasterDataList<SubstationMasterItem>;
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
  static mapData(data: MasterDataListRaw<SubstationMasterItem>): SubstationMasterData {
    return mapMasterDataList(data);
  }
}
