import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";

export const DISCONNECTION_DETAILS_PATH =
  "/indore/overall-dashboard/disconnection-details";

/** Backend always returns the last 6 IST calendar months (oldest → newest). */
export const DISCONNECTION_MONTH_COUNT = 6;

export const disconnectionDetailsData = {
  maxResponseTime: MASTER_DATA_MAX_RESPONSE_TIME_MS,
};
