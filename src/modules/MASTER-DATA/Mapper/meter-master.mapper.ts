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
  connection?: string | null;
  mf: number;
  /** Extended profile fields returned on live rows (not always in `columns`). */
  mtr?: number | string | null;
  mctr?: number | string | null;
  lptr?: number | string | null;
  lctr?: number | string | null;
  accuracyClass?: string | null;
  meterPoNumber?: string | null;
  meterPoDate?: string | null;
  meterTestingDate?: string | null;
  displayDigitCount?: number | null;
  deviceManufacturerTblRefId?: number | null;
  meterManufacturer?: string | null;
  meterModelTblRefId?: number | null;
  meterModel?: string | null;
  meterVersion?: number | string | null;
  meterStatus?: boolean | string | null;
  dlmsNonDlms?: string | null;
  meterRating?: number | string | null;
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
