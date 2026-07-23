/** Static fixtures for CONSUMERS mutation-proof (no live API). */

export const sampleConsumerProfileSuccess = {
  success: true as const,
  data: {
    consumerName: "Sample Consumer",
    consumerEmail: "a@b.com",
    consumerNumber: "5633025000",
    uniqueId: "UID-1",
    meterSerialNumber: "MSN-1",
    permanentAddress: "Addr",
    billingAddress: "Bill Addr",
    occupancyStatus: "Owner",
    connectionDetails: {},
    connectionMeterDetails: {},
    latestActivities: [],
  },
};

export const sampleCommunicationStatusSuccess = {
  success: true as const,
  data: {
    date: "2026-06-22",
    intervals: {
      display: "01:00 (10%)",
      subtitle: "Intervals",
      receivedToday: 10,
      expectedPerDay: 96,
    },
    delayed: { display: "00:00", subtitle: "Delayed", delaySeconds: 0 },
  },
};

export const sampleBillingHistorySuccess = {
  success: true as const,
  data: [
    {
      periodLabel: "January 2026",
      consumptionKwh: 100,
      billAmount: 500,
      consumptionSummaryText: "100 KWH Consumed",
      paymentStatus: "Paid",
    },
    {
      periodLabel: "December 2025",
      consumptionKwh: 90,
      billAmount: 450,
      consumptionSummaryText: "90 KWH Consumed",
      paymentStatus: "Paid",
    },
  ],
};

export const sampleBillingPeriodSuccess = {
  success: true as const,
  data: {
    monthlyConsumption: { title: "Monthly", value: 10 },
    dailyConsumption: { title: "Daily", value: 1 },
    totalOutstanding: { title: "Outstanding", value: 0 },
    billStatus: { title: "Status", value: "Paid" },
  },
};

export const sampleEnergyConsumptionGraphSuccess = {
  success: true as const,
  data: {
    period: "daily",
    points: [
      { label: "01", consumptionKwh: 1.5 },
      { label: "02", consumptionKwh: 2.0 },
    ],
  },
};

export const sampleEnergyFlowSuccess = {
  success: true as const,
  data: {
    period: "daily",
    points: [
      {
        label: "01",
        kwhImport: 1,
        kvahImport: 1.1,
        kwhExport: 0,
        kvahExport: 0,
      },
    ],
  },
};

export const sampleEventLogCardsSuccess = {
  success: true as const,
  data: {
    resolvedEvents: { count: 2, title: "Resolved" },
    pendingEvents: { count: 1, title: "Pending" },
    avgResolutionTime: { display: "01:00", title: "Avg" },
  },
};

export const sampleEventLogListSuccess = {
  success: true as const,
  data: {
    rows: [
      {
        serialNo: 1,
        meterNo: "M1",
        occurDateTime: "2026-01-01T00:00:00Z",
        restoreDateTime: null,
        description: "Event A",
        durationDisplay: "—",
        status: "Pending" as const,
      },
      {
        serialNo: 2,
        meterNo: "M1",
        occurDateTime: "2026-01-02T00:00:00Z",
        restoreDateTime: "2026-01-02T01:00:00Z",
        description: "Event B",
        durationDisplay: "01:00",
        status: "Resolved" as const,
      },
    ],
    page: 1,
    pageSize: 10,
    totalCount: 25,
    totalPages: 3,
  },
};

export const sampleLiveLoadProfileSuccess = {
  success: true as const,
  data: {
    lastReadingIso: "2026-01-01T00:00:00Z",
    meterPhase: "SP" as const,
    total: 1.2,
    metrics: [{ title: "kW", value: 1.2, percent: 50 }],
  },
};

export const samplePowerQualitySuccess = {
  success: true as const,
  data: {
    overallPf: { title: "PF", value: 0.95, unit: "" },
    frequency: { title: "Hz", value: 50, unit: "Hz" },
    neutralCurrent: { title: "In", value: 0.1, unit: "A" },
    mdKw: { title: "MD kW", value: 2, unit: "kW" },
    mdKva: { title: "MD kVA", value: 2.2, unit: "kVA" },
  },
};

export const sampleRealTimePowerSuccess = {
  success: true as const,
  data: {
    "R-Phase": {
      voltage: 230,
      voltageUnit: "V",
      current: 1,
      currentUnit: "A",
      powerFactor: 0.9,
      powerFactorUnit: "",
    },
  },
};

export const sampleValidateMeterSuccess = {
  success: true as const,
  data: {
    valid: true,
    meterExists: true,
    meterLookupId: 100,
    meterSerialNumber: "MSN-100",
    reason: null,
  },
};

export const sampleNearestAccountIdsSuccess = {
  success: true as const,
  data: {
    accountId: "8787878787",
    numericSuffix: "8787878787",
    maxDistance: 10,
    nearestAccountIds: [
      { accountId: "8787878788", distance: 1 },
      { accountId: "8787878789", distance: 2 },
    ],
  },
};

export const sampleActivationSuccess = {
  success: true as const,
  data: {
    consumer: {
      cid: "5633025000",
      tblRefId: 1,
      name: "Sample",
      status: "active",
    },
    previousStatus: "active",
  },
};
