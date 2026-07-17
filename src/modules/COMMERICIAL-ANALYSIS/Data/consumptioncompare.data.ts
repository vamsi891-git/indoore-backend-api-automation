/** API enum values for `type` query param */
export type ConsumptionCompareType =
  | "Consumption Compare Last Month"
  | "Consumption Compare Same Month Last Year"
  | "Abnormal High"
  | "Abnormal Low";

export const consumptionCompareLastMonthData = {
  month: 7,
  year: 2025,
  type: "Consumption Compare Last Month" as ConsumptionCompareType,
  page: 1,
  pageSize: 100,
} as const;

export const consumptionCompareSameMonthLastYearData = {
  month: 7,
  year: 2025,
  type: "Consumption Compare Same Month Last Year" as ConsumptionCompareType,
  page: 1,
  pageSize: 10,
} as const;

export const consumptionCompareAbnormalHighData = {
  month: 7,
  year: 2025,
  type: "Abnormal High" as ConsumptionCompareType,
  page: 1,
  pageSize: 10,
} as const;

export const consumptionCompareAbnormalLowData = {
  month: 7,
  year: 2025,
  type: "Abnormal Low" as ConsumptionCompareType,
  page: 1,
  pageSize: 10,
} as const;
