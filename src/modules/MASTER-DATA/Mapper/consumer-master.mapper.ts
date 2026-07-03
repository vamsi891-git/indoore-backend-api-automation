import { mapMasterDataList, MasterDataList } from "./master-data-list.mapper";

export type ConsumerMasterMeterType = "all" | "live" | "test";

export interface ConsumerMasterQuery {
  page?: number;
  limit?: number;
  q?: string;
  meterType?: ConsumerMasterMeterType;
  connectionStatusTblRefId?: number;
  categoryTblRefId?: number;
  isNetMeter?: boolean;
}

export interface ConsumerMasterResponse {
  success: boolean;
  data?: ConsumerMasterRawData;
  error?: { code?: string; message?: string };
}

export interface ConsumerMasterRawData {
  columns?: Array<{ key: string; header: string }>;
  rows?: ConsumerMasterItem[];
  items?: ConsumerMasterItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface ConsumerMasterData extends MasterDataList<ConsumerMasterItem> {
  columns: Array<{ key: string; header: string }>;
}

export interface ConsumerMasterItem {
  id?: string;
  slNo: number;
  division: string | null;
  zone: string | null;
  feeder: string | null;
  dtr: string | null;
  feederNameNew?: string | null;
  dtrNameNew?: string | null;
  consumerCid: string;
  consumerName: string;
  consumerAddress: string;
  consumerMobileNumber: string;
  category?: string;
  sanctionedLoadKw?: number;
  ivrsNo: string;
  existingIvrsNo?: string;
  meterSerialNumber: string;
  meterLookupTblRefId: number;
  meterPhase: string;
  mf?: number;
  installationDate?: string;
  latitude?: string | null;
  longitude?: string | null;
  connectedToDcu?: boolean;
  lsCount: number | null;
  dpCount: number | null;
}

export class ConsumerMasterMapper {
  static mapData(
    data: ConsumerMasterRawData | undefined,
    defaultLimit = 20,
  ): ConsumerMasterData {
    const list = mapMasterDataList(data ?? {}, defaultLimit);
    return {
      ...list,
      columns: data?.columns ?? [],
    };
  }
}
