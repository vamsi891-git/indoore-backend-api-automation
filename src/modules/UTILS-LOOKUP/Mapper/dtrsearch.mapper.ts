export interface DtrSearchResponse {
  success: boolean;
  data: DtrSearchRawData;
}

export interface DtrSearchRawData {
  columns?: Array<{ key: string; header: string }>;
  rows?: DtrRawItem[];
  items?: DtrRawItem[];
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

export interface DtrSearchData {
  item: DtrItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DtrRawItem {
  slNo?: number;
  circle?: string | null;
  division?: string | null;
  zone?: string | null;
  subStation?: string | null;
  feeder?: string | null;
  feederName?: string | null;
  feederCode?: string | null;
  code?: string;
  dtrCode?: string;
  dtrName?: string;
  dtr?: string;
  newDtrCode?: string | null;
  dtrCapacity?: string | number | null;
  meterMake?: string | null;
  meterLookupTblRefId?: number | null;
  meterSerialNumber?: string | null;
  mf?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  serviceDate?: string | null;
  id?: string;
}

export interface DtrItem {
  slNo: number;
  circle: string | null;
  division: string | null;
  zone: string | null;
  subStation: string | null;
  feeder: string | null;
  code: string;
  dtrCode: string;
  dtrName: string;
  dtr: string;
  meterSerialNumber: string | null;
  mf: string | null;
  latitude: string | null;
  longitude: string | null;
  serviceDate: string | null;
}

export class DtrSearchMapper {
  static mapData(data: DtrSearchRawData): DtrSearchData {
    const rawItems = data.rows ?? data.items ?? [];
    const pagination = data.pagination;
    const page = pagination?.page ?? data.page ?? 1;
    const limit = pagination?.limit ?? data.limit ?? 20;
    const total = pagination?.total ?? data.total ?? rawItems.length;

    const item: DtrItem[] = rawItems.map((row, index) => {
      const dtrCode = String(row.dtrCode ?? row.code ?? row.dtr ?? "").trim();
      const dtrName = String(row.dtrName ?? row.dtr ?? dtrCode).trim();
      const feeder = row.feederName ?? row.feeder ?? null;
      return {
        slNo: row.slNo ?? (page - 1) * limit + index + 1,
        circle: row.circle ?? null,
        division: row.division ?? null,
        zone: row.zone ?? null,
        subStation: row.subStation ?? null,
        feeder,
        code: String(row.code ?? dtrCode).trim(),
        dtrCode,
        dtrName,
        dtr: String(row.dtr ?? dtrName).trim(),
        meterSerialNumber: row.meterSerialNumber ?? null,
        mf: row.mf ?? null,
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        serviceDate: row.serviceDate ?? null,
      };
    });

    const totalPages =
      pagination?.totalPages ??
      data.totalPages ??
      Math.max(1, Math.ceil(total / limit));

    return {
      item,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
