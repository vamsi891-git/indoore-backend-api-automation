export const masterDataDefaultQuery = {
  page: 1,
  limit: 20,
} as const;

export const masterDataPage2Query = {
  page: 2,
  limit: 20,
} as const;

export const masterDataSmallPageQuery = {
  page: 1,
  limit: 10,
} as const;

export const masterDataMaxResponseTimeMs = 120_000;

export interface MasterDataListQuery {
  page?: number;
  limit?: number;
  q?: string;
}
