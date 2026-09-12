import { CONSUMPTION_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";

/** Live report window from GET /indore/consumption/report (dates + month/year as sent). */
export const consumptionReportFromDate =
  process.env.CONSUMPTION_FROM_DATE?.trim() || "2025-12-19";
export const consumptionReportToDate =
  process.env.CONSUMPTION_TO_DATE?.trim() || "2025-12-20";
export const consumptionReportMonth = Number(
  process.env.CONSUMPTION_MONTH?.trim() || "10",
);
export const consumptionReportYear = Number(
  process.env.CONSUMPTION_YEAR?.trim() || "2025",
);
export const consumptionReportPage = 1;
export const consumptionReportLimit = 10;
export const consumptionReportMaxResponseTime = CONSUMPTION_MAX_RESPONSE_TIME_MS;
