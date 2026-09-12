import {
  consumptionReportLimit,
  consumptionReportMaxResponseTime,
  consumptionReportMonth,
  consumptionReportPage,
  consumptionReportYear,
} from "./consumption-report-window.data";

export const monthlyNetMeterData = {
  page: consumptionReportPage,
  limit: consumptionReportLimit,
  month: consumptionReportMonth,
  year: consumptionReportYear,
  maxResponseTime: consumptionReportMaxResponseTime,
};
