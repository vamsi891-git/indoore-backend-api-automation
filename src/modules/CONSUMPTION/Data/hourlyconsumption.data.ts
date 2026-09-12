import {
  consumptionReportFromDate,
  consumptionReportLimit,
  consumptionReportMaxResponseTime,
  consumptionReportMonth,
  consumptionReportPage,
  consumptionReportToDate,
  consumptionReportYear,
} from "./consumption-report-window.data";

export const hourlyConsumptionData = {
  reportType: "hourly" as const,
  page: consumptionReportPage,
  limit: consumptionReportLimit,
  fromDate: consumptionReportFromDate,
  toDate: consumptionReportToDate,
  month: consumptionReportMonth,
  year: consumptionReportYear,
  maxResponseTime: consumptionReportMaxResponseTime,
};
