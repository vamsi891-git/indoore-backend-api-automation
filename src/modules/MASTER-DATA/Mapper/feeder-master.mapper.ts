// Mapper/feeder-master.mapper.ts

import {
  mapMasterDataList,
  MasterDataList,
  MasterDataListRaw,
} from "./master-data-list.mapper";

export interface FeederMasterResponse {
  success: boolean;
  data: MasterDataListRaw<FeederMasterItem>;
}

export type FeederMasterData = MasterDataList<FeederMasterItem>;

export interface FeederMasterItem{

slNo:number;

discomName:string|null;

regionName:string|null;

circleName:string|null;

divisionName:string|null;

zoneName:string|null;

substationName:string|null;

feederName:string;

dtrCount:number;

consumerCount:number;

}

export class FeederMasterMapper {
  static mapData(data: MasterDataListRaw<FeederMasterItem>): FeederMasterData {
    return mapMasterDataList(data);
  }
}