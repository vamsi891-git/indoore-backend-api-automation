/** Static fixtures for FEEDER mutation-proof (no live API). */

export const sampleFeederProfileSuccess = {
  success: true as const,
  data: {
    feederCode: "UVZ73",
    feederName: "Sample Feeder",
    status: "Active",
    parentDtr: { dtrCode: "DTR1", dtrName: "Sample DTR" },
    overview: [
      { title: "DTR Number", value: "1" },
      { title: "DTR Capacity", value: "100" },
      { title: "Feeder Capacity", value: "200" },
      { title: "Feeder Status", value: "ACTIVE" },
    ],
  },
};

export const sampleFeederAlertsSuccess = {
  success: true as const,
  data: {
    rows: [
      {
        serialNo: 1,
        eventType: "Power Failure",
        meterNumber: "19258966",
        occurredOn: "2026-01-01T10:00:00Z",
        duration: "01:00",
        status: "Active" as const,
      },
    ],
    page: 1,
    pageSize: 20,
    totalCount: 1,
    totalPages: 1,
  },
};

export const sampleFeederElectricalSuccess = {
  success: true as const,
  data: {
    lastCommunication: "2026-01-01T10:00:00Z",
    meterSerialNumber: "19258966",
    "R-Phase": {
      voltage: 230,
      voltageUnit: "Volts",
      current: 1.2,
      currentUnit: "Amps",
    },
    "Y-Phase": {
      voltage: 229,
      voltageUnit: "Volts",
      current: 1.1,
      currentUnit: "Amps",
    },
    "B-Phase": {
      voltage: 231,
      voltageUnit: "Volts",
      current: 1.0,
      currentUnit: "Amps",
    },
  },
};

export const sampleFeederDailyConsumptionSuccess = {
  success: true as const,
  data: {
    granularity: "day" as const,
    unit: "kWh",
    points: [
      { label: "Mon 01-01", key: "2026-01-01", kwh: 10.5 },
      { label: "Tue 02-01", key: "2026-01-02", kwh: 11.0 },
    ],
  },
};
