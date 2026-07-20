import { CONSUMPTION_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
export const dailyConsumptionData = {
    reportType: "daily" as const,
    page: 1,
    limit: 10,
    fromDate: "2025-12-19",
    toDate: "2025-12-20",
    month: 12,
    year: 2025,
    maxResponseTime: CONSUMPTION_MAX_RESPONSE_TIME_MS,
};
