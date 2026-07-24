/** Static fixtures for BILLING mutation-proof (no live API). */

export const sampleBillingDataSuccess = {
  success: true as const,
  data: {
    columns: [{ key: "meterNumber", header: "Meter" }],
    rows: [
      {
        slNo: 1,
        circle: "C1",
        division: "D1",
        zone: "Z1",
        substation: "S1",
        feeder: "F1",
        dtr: "DTR1",
        sanctionedLoadKw: 5,
        consumerName: "Sample",
        consumerAddress: "Addr",
        ivrsNumber: "123",
        tariff: "LT",
        meterNumber: "85080223",
        phase: "1",
        mf: 1,
        meterTimestamp: "2025-12-01T00:00:00Z",
        serviceDate: null,
        pf: 0.9,
        kwhC: 10,
        kvahC: 11,
        mdKw: 1,
        mdKva: 1,
      },
    ],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  },
};

export const sampleDaywiseBillingSuccess = {
  success: true as const,
  data: {
    columns: [{ key: "meterNumber", header: "Meter" }],
    rows: [
      {
        slNo: 1,
        division: "D1",
        zone: "Z1",
        feeder: "F1",
        dtr: "DTR1",
        consumerName: "Sample",
        consumerAddress: "Addr",
        ivrsNumber: "123",
        tariff: "LT",
        meterNumber: "85080223",
        phase: "1",
        mf: 1,
        sanctionedLoadKw: 5,
        d1Kwh: 1,
        d2Kwh: null,
      },
    ],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  },
};
