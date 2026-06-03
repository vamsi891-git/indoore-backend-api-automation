export interface ConsumerMasterResponse {
  success: boolean;
  data: ConsumerMasterData;
}

export interface ConsumerMasterData {
  items: ConsumerMasterItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConsumerMasterItem {
  slNo: number;
  circle: string | null;
  division: string | null;
  zone: string | null;
  subStation: string | null;
  feeder: string | null;
  dtr: string | null;
  regionName: string;
  discomName: string;
  consumerCid: string;
  consumerTblRefId: number;
  consumerName: string;
  consumerAddress: string;
  consumerMobileNumber: string;
  ivrsNo: string;
  accountId: string;
  meterSerialNumber: string;
  meterLookupTblRefId: number;
  tariff: string;
  meterPhase: string;
  connectedToDcu: boolean;
  lsCount: number | null;
  dpCount: number | null;
}

export class ConsumerMasterMapper {
  static mapData(data: ConsumerMasterData): ConsumerMasterData {
    return {
      items: data.items ?? [],
      total: data.total ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? 20,
      totalPages: data.totalPages ?? 0,
    };
  }
}
