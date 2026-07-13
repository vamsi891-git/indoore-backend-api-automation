import { CONSUMPTION_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";

export const patternConsumptionData = {
  page: 1,
  limit: 30,
  month: 12,
  year: 2025,
  maxResponseTime: CONSUMPTION_MAX_RESPONSE_TIME_MS,

  comparisonType: "comparison",
  lastThreeMonthsType: "lastThree",
  yearlyType: "yearly",

  allowedPhases: ["1 PH", "3PH WC", "HT"],
};
