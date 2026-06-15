export interface MasterDataPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** API may return legacy `items` or new `rows` + `pagination`. */
export interface MasterDataListRaw<T> {
  columns?: Array<{ key: string; header: string }>;
  rows?: T[];
  items?: T[];
  pagination?: MasterDataPagination;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface MasterDataList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function mapMasterDataList<T>(
  data: MasterDataListRaw<T>,
  defaultLimit = 20,
): MasterDataList<T> {
  const items = data.rows ?? data.items ?? [];
  const pagination = data.pagination;

  return {
    items,
    total: pagination?.total ?? data.total ?? items.length,
    page: pagination?.page ?? data.page ?? 1,
    limit: pagination?.limit ?? data.limit ?? defaultLimit,
    totalPages: pagination?.totalPages ?? data.totalPages ?? 1,
  };
}
