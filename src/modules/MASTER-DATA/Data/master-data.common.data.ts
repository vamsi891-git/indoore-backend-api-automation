import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";

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

/** Meter master list is very large — limit 10 stays within gateway timeout on live. */
export const meterMasterDefaultQuery = {
  page: 1,
  limit: 10,
} as const;

export const meterMasterPage2Query = {
  page: 2,
  limit: 10,
} as const;

export const masterDataMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export interface MasterDataListQuery {
  page?: number;
  limit?: number;
  q?: string;
}
