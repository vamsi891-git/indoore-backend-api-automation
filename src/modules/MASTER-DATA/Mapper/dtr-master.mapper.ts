import {
  mapMasterDataList,
  MasterDataList,
  MasterDataListRaw,
} from "./master-data-list.mapper";
import { firstNonBlank } from "../utils/master-data-field.helper";

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
  meterLookupTblRefId?: number;
  circle: string | null;
  division: string | null;
  zone: string | null;
  subStation: string | null;
  /** Normalized display feeder (feederName || feederCode || legacy feeder) */
  feeder: string | null;
  feederCode?: string | null;
  feederName?: string | null;
  /** Normalized display DTR (dtrCode || dtrName || legacy dtr) */
  dtr: string;
  dtrCode?: string | null;
  dtrName?: string | null;
  newDtrCode?: string | null;
  dtrCapacity?: string | null;
  meterSerialNumber: string | null;
  meterMake?: string | null;
  mf: string | null;
  latitude: string | null;
  longitude: string | null;
  serviceDate: string | null;
}

function normalizeDtrItem(item: DtrMasterItem): DtrMasterItem {
  // Prefer name for display/sort alignment with API ORDER BY "DTR Name"
  const dtr =
    firstNonBlank(item.dtrName, item.dtr, item.dtrCode, item.newDtrCode) ?? "";
  const feeder = firstNonBlank(item.feederName, item.feeder, item.feederCode);
  return {
    ...item,
    dtr,
    feeder,
  };
}

export class DtrMasterMapper {
  static mapData(
    data: MasterDataListRaw<DtrMasterItem> | undefined,
    defaultLimit = 20,
  ): DtrMasterData {
    const list = mapMasterDataList(data ?? {}, defaultLimit);
    return {
      ...list,
      items: list.items.map(normalizeDtrItem),
      columns: data?.columns ?? [],
    };
  }
}
