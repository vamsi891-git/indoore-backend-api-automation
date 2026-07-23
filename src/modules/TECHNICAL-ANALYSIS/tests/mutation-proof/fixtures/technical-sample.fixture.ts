/** Static fixtures for TECHNICAL-ANALYSIS mutation-proof (no live API). */

export const sampleTechnicalSummarySuccess = {
  success: true as const,
  data: {
    month: 12,
    year: 2025,
    reports: [
      {
        analysisType: "power_failure",
        reportName: "Power Failure",
        category: "technical",
        totalCount: 10,
        domesticCount: 6,
        nonDomesticCount: 4,
      },
      {
        analysisType: "over_voltage",
        reportName: "Over Voltage",
        category: "technical",
        totalCount: 2,
        domesticCount: 1,
        nonDomesticCount: 1,
      },
    ],
  },
};

export const sampleTechnicalReportSuccess = {
  success: true as const,
  data: {
    columns: [
      { key: "meterLookupId", header: "Meter Lookup Id" },
      { key: "ivrsNumber", header: "IVRS" },
      { key: "msn", header: "MSN" },
      { key: "durationInHours", header: "Duration (Hrs)" },
    ],
    rows: [
      {
        meterLookupId: 12345,
        subDivision: "Zone A",
        subStation: "SS1",
        feeder: "F1",
        dtr: "DTR1",
        name: "Sample Consumer",
        address: "Addr",
        ivrsNumber: "N1234567890",
        category: "Domestic",
        msn: "7060001",
        phase: "1 PH",
        durationInHours: 12.5,
        eventName: "Power Failure",
      },
    ],
    pagination: {
      page: 1,
      limit: 100,
      total: 1,
      totalPages: 1,
    },
  },
};
