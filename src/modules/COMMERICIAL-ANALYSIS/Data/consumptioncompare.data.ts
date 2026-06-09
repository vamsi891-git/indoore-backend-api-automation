/** API enum values for `type` query param */
export type ConsumptionCompareType =
  | "Consumption Compare Last Month"
  | "Consumption Compare Same Month Last Year"
  | "Abnormal High Consumption"
  | "Abnormal Low Consumption";

export const consumptionCompareLastMonthData = {
  month: 12,
  year: 2025,
  type: "Consumption Compare Last Month" as ConsumptionCompareType,
  page: 1,
  pageSize: 10,
} as const;

export const consumptionCompareSameMonthLastYearData = {
  month: 12,
  year: 2025,
  type: "Consumption Compare Same Month Last Year" as ConsumptionCompareType,
  page: 1,
  pageSize: 10,
} as const;

export const consumptionCompareAbnormalHighData = {
  month: 12,
  year: 2025,
  type: "Abnormal High Consumption" as ConsumptionCompareType,
  page: 1,
  pageSize: 10,
} as const;

export const consumptionCompareAbnormalLowData = {
  month: 12,
  year: 2025,
  type: "Abnormal Low Consumption" as ConsumptionCompareType,
  page: 1,
  pageSize: 10,
} as const;
