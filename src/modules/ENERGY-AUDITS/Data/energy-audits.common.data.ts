export const energyAuditPaths = {
  lossAnalysis: "/indore/energy-audit/loss-analysis",
  hourlyLossReport: "/indore/energy-audit/hourly-loss-report",
  lossAnalysisStats: "/indore/energy-audit/loss-analysis-stats",
  lossAnalysisTrends: "/indore/energy-audit/loss-analysis-trends",
  networkTrends: "/indore/energy-audit/network-trends",
} as const;

export const energyAuditDateRange = {
  fromDate: process.env.ENERGY_AUDIT_FROM_DATE?.trim() || "2025-12-20",
  toDate: process.env.ENERGY_AUDIT_TO_DATE?.trim() || "2025-12-20",
} as const;
