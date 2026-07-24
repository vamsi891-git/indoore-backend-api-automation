/** Static fixtures for OVERALL-DASHBOARD mutation-proof. */
export const sampleOverallMetricsSuccess = {
  success: true as const,
  data: {
    timestamp: "2026-01-01T00:00:00Z",
    networkDetails: {
      dtrs: { count: 10, percentage: 100, label: "DTRs" },
      feeders: { count: 5, percentage: 100, label: "Feeders" },
      substations: { count: 2, percentage: 100, label: "Substations" },
    },
    connectionStatus: { cd: { count: 8, percentage: 80, label: "CD" } },
  },
  message: "ok",
};

export const sampleOverallDtrCommSuccess = {
  success: true as const,
  data: {
    period: "daily" as const,
    points: [{ label: "1 Jan", communicating: 10, nonCommunicating: 2 }],
  },
  message: "ok",
};
