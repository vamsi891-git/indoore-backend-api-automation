import {
  mapMasterDataList,
  MasterDataList,
  MasterDataListRaw,
} from "./master-data-list.mapper";

export interface MeterMasterQuery {
  page?: number;
  limit?: number;
  q?: string;
}

export interface MeterMasterItem {
  id: string;
  slNo: number;
  meterLookupTblRefId: number;
  meterSerialNumber: string | null;
  simNumber: string | null;
  ismiNumber: string | null;
  ipAddress: string | null;
  modemSerialNumber: string | null;
  modemImeiNumber: string | null;
  organisationLookupTblRefId: number;
  networkLookupTblRefId: number;
  isActiveStatus: boolean;
  assetId: string | null;
  meterRapdrpCode: string | null;
  mf: number;
}

export interface MeterMasterRawData extends MasterDataListRaw<MeterMasterItem> {}

export interface MeterMasterResponse {
  success: boolean;
  data?: MeterMasterRawData;
  error?: { code?: string; message?: string };
}

export interface MeterMasterData extends MasterDataList<MeterMasterItem> {
  columns: Array<{ key: string; header: string }>;
}

export class MeterMasterMapper {
  static mapData(
    raw: MeterMasterRawData | undefined,
    defaultLimit = 20,
  ): MeterMasterData {
    const list = mapMasterDataList(raw ?? {}, defaultLimit);
    return {
      ...list,
      columns: raw?.columns ?? [],
    };
  }
}
