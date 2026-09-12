/** Static fixtures for OVERALL-DASHBOARD mutation-proof. */
export const sampleOverallMetricsSuccess = {
  success: true as const,
  data: {
    billingAvailability: {
      value: "100 Meters · 1.00 Lac",
      footerDelta: 1,
      sparklineData: [1, 1, 2],
    },
    billingEfficiency: {
      value: "10 LU · 2.00 Lac",
      footerDelta: 2,
      sparklineData: [1, 1, 2],
    },
    revenueGainedRpu: {
      value: "Input 1 LU · RPU Rs 0.1 · Amt 1.00 Lac",
      footerDelta: 1,
      sparklineData: [1, 1, 1],
    },
    totalImprovement: {
      value: "1.00 Cr",
      footer: "Overall benefit (sum of amounts)",
      footerDelta: 0.1,
      sparklineData: [0.5, 0.5, 1],
    },
    avgImprovement: {
      value: "₹ 100.00 / month",
      footer: "Average improvement per bill",
      footerDelta: 10,
      sparklineData: [90, 90, 100],
    },
    subsidySave: {
      value: "1.00 Lac",
      footerDelta: 1,
      sparklineData: [1, 1, 1],
    },
    incentivePf: {
      value: "10 No 1.00 Lac",
      footerDelta: 1,
      sparklineData: [1, 1, 1],
    },
    penaltyPf: {
      value: "5 No 0.50 Lac",
      footerDelta: 0.5,
      sparklineData: [0.5, 0.5, 0.5],
    },
    expectedRoi: {
      value: "12 Months",
      footer: "From Date of Award",
      footerDelta: 0,
      sparklineData: [] as number[],
    },
    loadEnhanced: {
      value: "1.00 MW",
      footer: "Due to increase in Sanction Load",
      footerDelta: 0,
      sparklineData: [] as number[],
    },
    installationSummary: [
      { label: "Mapped Meters", value: 100, percent: 99 },
      { label: "Unmapped Meters", value: 1, percent: 1 },
    ],
    disconnectionData: {
      categories: ["Jan 2026"],
      series: [{ name: "Disconnected Meters", data: [0] }],
    },
  },
};

export const sampleInstallationSummarySuccess = {
  success: true as const,
  data: {
    totalMeterCount: 100,
    installedMeters: {
      title: "Mapped Meters",
      meterCount: 90,
      sharePercent: 90,
    },
    nonInstalledMeters: {
      title: "Unmapped Meters",
      meterCount: 10,
      sharePercent: 10,
    },
  },
  message: "Installation summary fetched successfully.",
};

export const sampleDisconnectionDetailsSuccess = {
  success: true as const,
  data: {
    months: [
      { month: "Apr 2026", disconnected: 0, connected: 0 },
      { month: "May 2026", disconnected: 0, connected: 0 },
      { month: "Jun 2026", disconnected: 0, connected: 0 },
      { month: "Jul 2026", disconnected: 1, connected: 2 },
      { month: "Aug 2026", disconnected: 0, connected: 0 },
      { month: "Sept 2026", disconnected: 0, connected: 3 },
    ],
  },
  message: "Disconnection details fetched successfully.",
};

export const sampleOverallDtrCommSuccess = {
  success: true as const,
  data: {
    period: "daily" as const,
    points: [{ label: "1 Jan", communicating: 10, nonCommunicating: 2 }],
  },
  message: "ok",
};
