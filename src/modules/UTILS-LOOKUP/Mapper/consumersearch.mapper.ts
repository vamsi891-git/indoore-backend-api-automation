export interface SearchConsumerResponse {
  success: boolean;
  data: SearchConsumerRawData;
}

export interface SearchConsumerRawData {
  columns?: Array<{ key: string; header: string }>;
  rows?: ConsumerItem[];
  items?: ConsumerItem[];
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

export interface SearchConsumerData {
  items: ConsumerItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Live search API returns a slim consumer grid (not full master row). */
export interface ConsumerItem {
  id?: string;
  slNo?: number;
  consumerName: string;
  consumerCid: string;
  consumerAddress: string;
  ivrsNo: string;
  existingIvrsNo: string;
  meterSerialNumber: string;
  consumerMobileNumber: string;
}

export class SearchConsumerMapper {
  static mapData(data: SearchConsumerRawData): SearchConsumerData {
    const rawItems = data.rows ?? data.items ?? [];
    const pagination = data.pagination;
    const page = pagination?.page ?? data.page ?? 1;
    const limit = pagination?.limit ?? data.limit ?? 20;

    const items = rawItems.map((item, index) => ({
      ...item,
      slNo: item.slNo ?? (page - 1) * limit + index + 1,
    }));

    return {
      items,
      total: pagination?.total ?? data.total ?? items.length,
      page,
      limit,
      totalPages: pagination?.totalPages ?? data.totalPages ?? 1,
    };
  }
}
