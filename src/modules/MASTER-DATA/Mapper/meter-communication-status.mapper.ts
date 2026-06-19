import {
  mapMasterDataList,
  MasterDataList,
  MasterDataListRaw,
} from "./master-data-list.mapper";

export interface MeterCommunicationStatusQuery {
  page?: number;
  limit?: number;
  organisationLookupId?: number;
  networkLookupId?: number;
  q?: string;
  communicationStatus?: string;
}

export interface MeterCommunicationStatusItem {
  slNo: number;
  meterSerialNumber: string | null;
  communicationStatus: string;
  lastCommunication: string | null;
}

export interface MeterCommunicationStatusRawData
  extends MasterDataListRaw<MeterCommunicationStatusItem> {
  communicatingCount?: number;
  nonCommunicatingCount?: number;
  unknownCount?: number;
  activeMeters?: number;
}

export interface MeterCommunicationStatusResponse {
  success: boolean;
  data?: MeterCommunicationStatusRawData;
  error?: { code?: string; message?: string };
}

export interface MeterCommunicationStatusData
  extends MasterDataList<MeterCommunicationStatusItem> {
  communicatingCount: number;
  nonCommunicatingCount: number;
  unknownCount: number;
  activeMeters: number;
  columns: Array<{ key: string; header: string }>;
}

export class MeterCommunicationStatusMapper {
  static mapData(
    raw: MeterCommunicationStatusRawData | undefined,
    defaultLimit = 20,
  ): MeterCommunicationStatusData {
    const list = mapMasterDataList(raw ?? {}, defaultLimit);
    return {
      ...list,
      communicatingCount: raw?.communicatingCount ?? 0,
      nonCommunicatingCount: raw?.nonCommunicatingCount ?? 0,
      unknownCount: raw?.unknownCount ?? 0,
      activeMeters: raw?.activeMeters ?? list.total,
      columns: raw?.columns ?? [],
    };
  }
}
