export const alarmsEventsDashboardData = {
  path:"/indore/alarms-events/dashboard",
  maxResponseTime: 60_000,
};
export const EXPECTED_DASHBOARD_COLUMNS = [
  "power",
  "current",
  "voltage",
  "transaction",
  "other",
  "nonRolloverControl"
] as const;