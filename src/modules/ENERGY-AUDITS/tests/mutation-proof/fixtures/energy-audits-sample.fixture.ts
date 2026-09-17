export const sampleEnergyAuditsSuccess = {
  success: true as const,
  data: {
    items: [{ id: 1, name: "Sample" }],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
};

export const sampleLossAnalysisSuccess = {
  success: true as const,
  data: {
    columns: [
      { key: "circle", header: "Circle" },
      { key: "dtrName", header: "DTR Name" },
    ],
    rows: [
      {
        id: "meter-MSN-1",
        circle: "C1",
        division: "D1",
        zone: "Z1",
        feeder: "F1",
        dtrCode: "DTR-001",
        dtrRating: 100,
        dtrName: "DTR-A",
        mf: "1",
        meterSerialNumber: "MSN-1",
        inputUnits: 100,
        consumerCount: 2,
        totalSoldUnits: 90,
        lossKwh: 10,
        billingEfficiencyPct: 90,
        lossPct: 10,
      },
    ],
    pagination: { page: 1, limit: 30, total: 1, totalPages: 1 },
  },
};

export const sampleHourlyLossSuccess = {
  success: true as const,
  data: {
    columns: [{ key: "rowKind", header: "Row Kind" }],
    rows: [
      {
        id: "summary-dtr-1",
        rowKind: "DTRCONSUMPTION",
        circle: "C1",
        division: "D1",
        zone: "Z1",
        substation: "S1",
        feeder: "F1",
        dtrName: "DTR-A",
        dtrMeterSerialNumber: "DTRMSN",
        consumerName: "Summary",
        meterSerialNumber: null,
        mf: "1",
        H1: 10,
        total: 10,
      },
      {
        id: "summary-consumer-1",
        rowKind: "CONSUMERCONSUMPTION",
        circle: "C1",
        division: "D1",
        zone: "Z1",
        substation: "S1",
        feeder: "F1",
        dtrName: "DTR-A",
        dtrMeterSerialNumber: "DTRMSN",
        consumerName: "Summary",
        meterSerialNumber: null,
        mf: "1",
        H1: 8,
        total: 8,
      },
      {
        id: "summary-loss-1",
        rowKind: "LOSSPERCENTAGE",
        circle: "C1",
        division: "D1",
        zone: "Z1",
        substation: "S1",
        feeder: "F1",
        dtrName: "DTR-A",
        dtrMeterSerialNumber: "DTRMSN",
        consumerName: "Summary",
        meterSerialNumber: null,
        mf: "1",
        H1: 20,
        total: 20,
      },
    ],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  },
};

export const sampleLossAnalysisStatsSuccess = {
  success: true as const,
  data: {
    networkLookupId: 6081,
    fromDate: "2025-12-20",
    toDate: "2025-12-20",
    totalEnergyInput: 100,
    totalConsumption: 90,
    totalLoss: 10,
    peakLossHour: { hour: "H1", time: "00:00", lossPct: 12 },
    lowestLossHour: { hour: "H2", time: "01:00", lossPct: 4 },
  },
};

export const sampleLossAnalysisTrendsSuccess = {
  success: true as const,
  data: {
    networkLookupId: 6081,
    date: "2025-12-20",
    items: Array.from({ length: 24 }, (_, index) => ({
      hour: `H${index + 1}`,
      time: `${String(index).padStart(2, "0")}:00`,
      lossPct: index,
    })),
  },
};

export const sampleNetworkTrendsBillingSuccess = {
  success: true as const,
  data: {
    reportType: "billing" as const,
    anchorDate: null,
    anchorMonth: 12,
    anchorYear: 2025,
    items: Array.from({ length: 12 }, (_, index) => ({
      date: null,
      month: index + 1,
      year: 2025,
      periodLabel: `Month ${index + 1} 2025`,
      lossPct: index,
    })),
  },
};
