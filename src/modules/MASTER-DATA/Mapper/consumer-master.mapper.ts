export interface ConsumerMasterResponse {
  success: boolean;
  data: ConsumerMasterRawData;
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

export interface ConsumerMasterData {
  items: ConsumerMasterItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConsumerMasterItem {
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
  static mapData(data: ConsumerMasterRawData): ConsumerMasterData {
    const items = data.rows ?? data.items ?? [];
    const pagination = data.pagination;

    return {
      items,
      total: pagination?.total ?? data.total ?? items.length,
      page: pagination?.page ?? data.page ?? 1,
      limit: pagination?.limit ?? data.limit ?? 20,
      totalPages: pagination?.totalPages ?? data.totalPages ?? 1,
    };
  }
}
