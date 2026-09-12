import { mapMasterDataList, MasterDataList } from "./master-data-list.mapper";
import { firstNonBlank } from "../utils/master-data-field.helper";

export type ConsumerMasterMeterType = "all" | "live" | "test";

export interface ConsumerMasterQuery {
  page?: number;
  limit?: number;
  q?: string;
  meterType?: ConsumerMasterMeterType;
  /** When true, response includes LS/IP/DP/event archive count columns. */
  includeArchiveCounts?: boolean;
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
  circle?: string | null;
  division: string | null;
  zone: string | null;
  /** Normalized feeder label */
  feeder: string | null;
  /** Normalized DTR label */
  dtr: string | null;
  feederCode?: string | null;
  feederName?: string | null;
  dtrCode?: string | null;
  dtrName?: string | null;
  newDtrCode?: string | null;
  dtrCapacity?: string | null;
  feederNameNew?: string | null;
  dtrNameNew?: string | null;
  consumerCid: string;
  /** Present on live rows; not always listed in `columns`. */
  consumerTblRefId?: number | null;
  consumerName: string;
  consumerAddress: string;
  consumerMobileNumber: string;
  category?: string | null;
  sanctionedLoadKw?: number | null;
  ivrsNo: string;
  existingIvrsNo?: string;
  meterSerialNumber: string | null;
  meterMake?: string | null;
  meterLookupTblRefId: number | null;
  meterPhase: string | null;
  mf?: number | null;
  installationDate?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  connectedToDcu?: boolean;
  lsCount: number | null;
  ipCount?: number | null;
  dpCount: number | null;
  /** Legacy — omitted on current live API. */
  billingCount?: number | null;
  eventCount?: number | null;
}

function normalizeConsumerItem(item: ConsumerMasterItem): ConsumerMasterItem {
  return {
    ...item,
    feeder: firstNonBlank(
      item.feederName,
      item.feeder,
      item.feederNameNew,
      item.feederCode,
    ),
    dtr: firstNonBlank(
      item.dtrName,
      item.dtr,
      item.dtrNameNew,
      item.dtrCode,
      item.newDtrCode,
    ),
  };
}

export class ConsumerMasterMapper {
  static mapData(
    data: ConsumerMasterRawData | undefined,
    defaultLimit = 20,
  ): ConsumerMasterData {
    const list = mapMasterDataList(data ?? {}, defaultLimit);
    return {
      ...list,
      items: list.items.map(normalizeConsumerItem),
      columns: data?.columns ?? [],
    };
  }
}
