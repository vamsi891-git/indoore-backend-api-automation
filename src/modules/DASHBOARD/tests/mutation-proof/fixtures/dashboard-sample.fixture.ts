/** Static fixtures for DASHBOARD mutation-proof (no live API). */

export const sampleDashboardMetricsSuccess = {
  success: true as const,
  data: {
    timestamp: "2026-01-01T00:00:00Z",
    connectionStatus: {
      totalMeterCount: 100,
      cd: { count: 80, percentage: 80, label: "Communicating" },
    },
    categoryWiseConsumer: {
      residential: { count: 50, percentage: 50, label: "Residential" },
    },
    phaseWiseConsumer: {
      "1ph": { count: 40, percentage: 40, label: "1 PH" },
    },
    oemWiseConsumer: {
      elSewedy: { count: 10, percentage: 10, label: "ElSewedy" },
    },
    consumerType: {
      totalConsumers: { count: 100, percentage: 100, label: "Total" },
    },
    networkDetails: {
      dtrs: { count: 20, percentage: 100, label: "DTRs" },
      feeders: { count: 5, percentage: 100, label: "Feeders" },
      substations: { count: 2, percentage: 100, label: "Substations" },
      consumers: { count: 100, percentage: 100, label: "Consumers" },
    },
  },
};

export const sampleDtrSummarySuccess = {
  success: true as const,
  data: {
    period: "daily" as const,
    totalDtrs: { label: "Total", count: 20, trends: [1, 2, 3] },
    dtrsOn: { label: "On", count: 15, trends: [1, 2, 3] },
    dtrsOff: { label: "Off", count: 5, trends: [1, 2, 3] },
    activeAlerts: { label: "Alerts", count: 2, trends: [0, 1, 2] },
  },
};

export const sampleDtrConsumptionSuccess = {
  success: true as const,
  data: {
    period: "daily" as const,
    points: [{ label: "1 Jan", kwh: 10, kvah: 11, kvarh: 1 }],
  },
};

export const sampleDtrCommunicationSuccess = {
  success: true as const,
  data: {
    period: "daily" as const,
    points: [{ label: "1 Jan", communicating: 10, nonCommunicating: 2 }],
  },
};

export const sampleDtrPowerStatusSuccess = {
  success: true as const,
  data: {
    period: "daily" as const,
    points: [
      {
        label: "1 Jan",
        dtrsOn: 10,
        dtrsOff: 2,
        onPercentage: 83,
        offPercentage: 17,
      },
    ],
  },
};

export const sampleDtrLoadUnbalanceSuccess = {
  success: true as const,
  data: {
    items: [
      { label: "Severe", value: 1, percentage: 5 },
      { label: "Moderate", value: 2, percentage: 10 },
      { label: "Balanced", value: 17, percentage: 85 },
    ],
  },
};

export const sampleDtrVoltageUnbalanceSuccess = sampleDtrLoadUnbalanceSuccess;
