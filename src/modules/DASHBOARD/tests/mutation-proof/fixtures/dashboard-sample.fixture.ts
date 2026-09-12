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
    total: 20,
    items: [
      { label: "Severe", value: 1, percentage: 5 },
      { label: "Moderate", value: 2, percentage: 10 },
      { label: "Balanced", value: 17, percentage: 85 },
    ],
  },
};

export const sampleDtrVoltageUnbalanceSuccess = {
  success: true as const,
  data: {
    total: 341,
    items: [
      { label: "Severe", value: 8, percentage: 2.4 },
      { label: "Moderate", value: 38, percentage: 11.2 },
      { label: "Balanced", value: 295, percentage: 86.4 },
    ],
  },
};

export const sampleDtrLoadUnbalanceDetailsSuccess = {
  success: true as const,
  data: {
    columns: [
      { key: "circle", header: "Circle" },
      { key: "division", header: "Division" },
      { key: "zone", header: "Zone" },
      { key: "subStation", header: "Sub Station" },
      { key: "feeder", header: "Feeder" },
      { key: "dtr", header: "DTR" },
      { key: "logDate", header: "Log Date" },
      { key: "loadingCondition", header: "Loading Condition" },
      { key: "loadingUnbalance", header: "Loading Unbalance" },
      { key: "ir", header: "IR" },
      { key: "iy", header: "IY" },
      { key: "ib", header: "IB" },
    ],
    rows: [
      {
        id: "row-1-m-1001",
        circle: "Indore city circle",
        division: "CENTRAL",
        zone: "RajMohalla",
        subStation: "Raj Mohalla",
        feeder: "AIR(CHQ)",
        dtr: "RZ8132",
        logDate: "13th Jul 2026, 02:00 AM",
        loadingCondition: "<5%",
        loadingUnbalance: 52.8,
        ir: 55.8,
        iy: 70.26,
        ib: 1.0,
      },
    ],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  },
};

export const sampleDtrVoltageUnbalanceDetailsSuccess = {
  success: true as const,
  data: {
    columns: [
      { key: "circle", header: "Circle" },
      { key: "division", header: "Division" },
      { key: "zone", header: "Zone" },
      { key: "subStation", header: "Sub Station" },
      { key: "feeder", header: "Feeder" },
      { key: "dtr", header: "DTR" },
      { key: "logDate", header: "Log Date" },
      { key: "loadingCondition", header: "Loading Condition" },
      { key: "voltageUnbalance", header: "Voltage Unbalance" },
      { key: "vrn", header: "VRN" },
      { key: "vyn", header: "VYN" },
      { key: "vbn", header: "VBN" },
    ],
    rows: [
      {
        id: "row-1-m-1001",
        circle: "Indore city circle",
        division: "CENTRAL",
        zone: "Hawabangla",
        subStation: "PragatiNagar",
        feeder: "PARMANU NAGAR(CHQ)",
        dtr: "RJ6611",
        logDate: "13th Jul 2026, 02:00 AM",
        loadingCondition: "<5%",
        voltageUnbalance: 1.2,
        vrn: 230.1,
        vyn: 228.4,
        vbn: 229,
      },
    ],
    pagination: { page: 1, limit: 10, total: 295, totalPages: 30 },
  },
};

export const sampleDtrPowerStatusDetailsSuccess = {
  success: true as const,
  data: {
    columns: [
      { key: "circle", header: "Circle" },
      { key: "division", header: "Division" },
      { key: "zone", header: "Zone" },
      { key: "subStation", header: "Sub Station" },
      { key: "feeder", header: "Feeder" },
      { key: "dtr", header: "DTR" },
      { key: "msn", header: "MSN" },
      { key: "status", header: "Status" },
      { key: "lastAlarmAt", header: "Last Alarm At" },
    ],
    rows: [
      {
        id: "meter-19271515",
        circle: "Indore city circle",
        division: "WEST",
        zone: "GPH",
        subStation: "PARMANU NAGAR(CHQ)",
        feeder: "RJ665",
        dtr: "10IW1",
        msn: "19271515",
        status: "ON",
        lastAlarmAt: null,
      },
    ],
    pagination: { page: 1, limit: 10, total: 1134, totalPages: 114 },
  },
};

export const sampleDtrCommunicationDetailsSuccess = {
  success: true as const,
  data: {
    columns: [
      { key: "circle", header: "Circle" },
      { key: "division", header: "Division" },
      { key: "zone", header: "Zone" },
      { key: "subStation", header: "Sub Station" },
      { key: "feeder", header: "Feeder" },
      { key: "dtr", header: "DTR" },
      { key: "msn", header: "MSN" },
      { key: "lastSeen", header: "Log Date" },
      { key: "status", header: "Status" },
    ],
    rows: [
      {
        id: "meter-19271515",
        circle: "Indore city circle",
        division: "WEST",
        zone: "GPH",
        subStation: "PARMANU NAGAR(CHQ)",
        feeder: "RJ665",
        dtr: "10IW1",
        msn: "19271515",
        lastSeen: null,
        status: "Non-Communicating",
      },
    ],
    pagination: { page: 1, limit: 10, total: 1134, totalPages: 114 },
  },
};

export const sampleDtrConsumptionDetailsSuccess = {
  success: true as const,
  data: {
    columns: [
      { key: "circle", header: "Circle" },
      { key: "division", header: "Division" },
      { key: "zone", header: "Zone" },
      { key: "subStation", header: "Sub Station" },
      { key: "feeder", header: "Feeder" },
      { key: "dtr", header: "DTR" },
      { key: "msn", header: "MSN" },
      { key: "kwh", header: "kWh" },
      { key: "logDate", header: "Log Date" },
    ],
    rows: [
      {
        id: "meter-19271515",
        circle: "Indore city circle",
        division: "WEST",
        zone: "GPH",
        subStation: "PARMANU NAGAR(CHQ)",
        feeder: "RJ665",
        dtr: "10IW1",
        msn: "19271515",
        kwh: 0,
        logDate: null,
      },
    ],
    pagination: { page: 1, limit: 10, total: 1134, totalPages: 114 },
  },
};

export const sampleDtrPercentageLoadingDetailsSuccess = {
  success: true as const,
  data: {
    columns: [
      { key: "circle", header: "Circle" },
      { key: "division", header: "Division" },
      { key: "zone", header: "Zone" },
      { key: "subStation", header: "Sub Station" },
      { key: "feeder", header: "Feeder" },
      { key: "dtr", header: "DTR" },
      { key: "msn", header: "MSN" },
      { key: "loadingCondition", header: "Loading Condition" },
      { key: "loadingKva", header: "DTR Loading (kVA)" },
      { key: "dtrRating", header: "DTR Capacity (kVA)" },
      { key: "loadPercent", header: "Load %" },
      { key: "logDate", header: "Log Date" },
    ],
    rows: [
      {
        id: "meter-19271515",
        circle: "Indore city circle",
        division: "WEST",
        zone: "GPH",
        subStation: "PARMANU NAGAR(CHQ)",
        feeder: "RJ665",
        dtr: "10IW1",
        msn: "19271515",
        loadingCondition: ">=75%",
        loadingKva: 0,
        dtrRating: 100,
        loadPercent: 0,
        logDate: null,
      },
    ],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  },
};

export const sampleConsumerConnectionStatusSuccess = {
  success: true as const,
  data: {
    columns: [
      { key: "slNo", header: "Sl.No." },
      { key: "consumerName", header: "Consumer Name" },
      { key: "consumerAddress", header: "Consumer Address" },
      { key: "ivrs", header: "IVRS" },
      { key: "meterSerialNumber", header: "Meter Sl No." },
      { key: "meterPhase", header: "Phase" },
      { key: "connectionStatus", header: "Connection Status" },
      { key: "latitude", header: "Latitude" },
      { key: "longitude", header: "Longitude" },
      { key: "serviceDate", header: "Service Date" },
    ],
    rows: [
      {
        id: "meter-10",
        slNo: 1,
        consumerName: "Test consumer 1",
        consumerAddress: "12 MG Road, Indore",
        ivrs: "6428524820",
        meterSerialNumber: "20151631",
        meterPhase: "1 PH",
        connectionStatus: "Connected",
        latitude: "123.000000",
        longitude: "123.000000",
        serviceDate: "Jun 1, 2026 12:00 AM",
        manufacturerName: "El Sewedy",
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
  message: "Data fetched successfully",
};

export const sampleConsumerCategoryDistributionSuccess = {
  success: true as const,
  data: {
    columns: [
      { key: "slNo", header: "Sl.No." },
      { key: "consumerName", header: "Consumer Name" },
      { key: "consumerAddress", header: "Consumer Address" },
      { key: "ivrs", header: "IVRS" },
      { key: "meterSerialNumber", header: "Meter Sl No." },
      { key: "meterPhase", header: "Phase" },
      { key: "serviceDate", header: "Service Date" },
    ],
    rows: [
      {
        id: "meter-10",
        slNo: 1,
        consumerName: "Test consumer 1",
        consumerAddress: "12 MG Road, Indore",
        ivrs: "6428524820",
        meterSerialNumber: "20151631",
        meterPhase: "1 PH",
        connectionStatus: "Connected",
        latitude: "123.000000",
        longitude: "123.000000",
        serviceDate: "Jun 1, 2026 12:00 AM",
        manufacturerName: "El Sewedy",
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
  message: "Data fetched successfully",
};

export const sampleConsumerPhaseDistributionSuccess = {
  success: true as const,
  data: {
    columns: [
      { key: "slNo", header: "Sl.No." },
      { key: "consumerName", header: "Consumer Name" },
      { key: "consumerAddress", header: "Consumer Address" },
      { key: "ivrs", header: "IVRS" },
      { key: "meterSerialNumber", header: "Meter Sl No." },
      { key: "meterPhase", header: "Phase" },
      { key: "serviceDate", header: "Service Date" },
    ],
    rows: [
      {
        id: "meter-10",
        slNo: 1,
        consumerName: "Test consumer 1",
        consumerAddress: "12 MG Road, Indore",
        ivrs: "6428524820",
        meterSerialNumber: "20151631",
        meterPhase: "1 PH",
        connectionStatus: "Connected",
        latitude: "123.000000",
        longitude: "123.000000",
        serviceDate: "Jun 1, 2026 12:00 AM",
        manufacturerName: "El Sewedy",
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
  message: "Data fetched successfully",
};

export const sampleRevenueSubsidyPfSuccess = {
  success: true as const,
  data: {
    id: "b79e1d24-f5cd-406a-bbcc-f1ddf3950a10",
    periodYear: 2026,
    periodMonth: 8,
    billingAvailability: { meterCount: 3424488, amount: 1600000 },
    billingEfficiency: { energyLu: 1521.37, amount: 3250000 },
    revenueGainedRpu: { inputLu: 41167.7, rpu: 0.28, amount: 4000000 },
    subsidyAmount: 1300000,
    incentivePf: { meterCount: 154631, amount: 900000 },
    penaltyPf: { meterCount: 73614, amount: 260000 },
    billCount: 60000,
    overallImprovement: 11310000,
    overallImprovementCr: 1.131,
    avgImprovement: 188.5 as number | null,
    createdByUserId: "de489b64-c85b-4c88-aa1b-5c005f417a48",
    updatedByUserId: "c50fe3ff-260c-40a4-b367-ccfa1da5c4d8",
    createdAt: "2026-08-02T19:48:55.813Z",
    updatedAt: "2026-08-04T16:03:04.812Z",
  },
  message: "Revenue, subsidy, and PF amounts retrieved successfully.",
};

export const sampleConsumerOemDistributionSuccess = {
  success: true as const,
  data: {
    columns: [
      { key: "slNo", header: "Sl.No." },
      { key: "consumerName", header: "Consumer Name" },
      { key: "consumerAddress", header: "Consumer Address" },
      { key: "ivrs", header: "IVRS" },
      { key: "meterSerialNumber", header: "Meter Sl No." },
      { key: "latitude", header: "Latitude" },
      { key: "longitude", header: "Longitude" },
      { key: "manufacturerName", header: "Manufacturer Name" },
    ],
    rows: [
      {
        id: "meter-10",
        slNo: 1,
        consumerName: "Test consumer 1",
        consumerAddress: "12 MG Road, Indore",
        ivrs: "6428524820",
        meterSerialNumber: "20151631",
        meterPhase: "1 PH",
        connectionStatus: "Connected",
        latitude: "123.000000",
        longitude: "123.000000",
        serviceDate: "Jun 1, 2026 12:00 AM",
        manufacturerName: "L&T",
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
  message: "Data fetched successfully",
};
