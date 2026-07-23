/** Static fixtures for METER-REPLACEMENT mutation-proof (no live API). */

export const sampleDashboardSummarySuccess = {
  success: true as const,
  data: {
    overall: {
      totalMetersRequested: 100,
      totalMetersReplaced: 40,
      totalPendingMeters: 50,
      totalUnmappedMeters: 10,
    },
    myWork: {
      completedToday: 2,
      completedThisMonth: 15,
      totalCompleted: 40,
      latestCompletedDate: "2026-07-20",
    },
  },
};

export const sampleProgressSuccess = {
  success: true as const,
  data: {
    weekly: { labels: ["Mon", "Tue"], values: [1, 2] },
    monthly: { labels: ["Jan", "Feb"], values: [10, 20] },
  },
};

export const sampleConsumerSearchSuccess = {
  success: true as const,
  data: [{ consumerId: 1064, consumerName: "REENA UPADHYAY" }],
};

export const sampleConsumerDetailSuccess = {
  success: true as const,
  data: {
    consumer: "REENA UPADHYAY",
    ivrs: "3544019391",
    rrNumber: "3544019391",
    consumerId: 1064,
    consumerCid: "CID-1064",
    accountId: "N3008013701",
    servicePointId: "SP-1",
    address: "Sample Address",
    zone: "Zone A",
    office: "Office 1",
    oldMeterLookupId: 100,
    oldMeterSerial: "85080223",
    oldMeterStatus: "ACTIVE" as const,
    latitude: "22.7",
    longitude: "75.8",
    consumerStatus: "ACTIVE" as const,
    replacementEligible: true,
  },
};

export const sampleMeterValidationSuccess = {
  success: true as const,
  data: {
    valid: true,
    message: "Meter is available",
    meterLookupId: 200,
    meterSerial: "85081162",
  },
};

export const sampleSubmissionHistorySuccess = {
  success: true as const,
  data: {
    items: [
      {
        id: 8,
        consumerName: "REENA UPADHYAY",
        oldMeterSerial: "85080223",
        newMeterSerial: "85081162",
        replacementReason: "Faulty",
        status: "COMPLETED" as const,
        createdAt: "2026-07-01T10:00:00Z",
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
};

export const sampleSubmissionDetailSuccess = {
  success: true as const,
  data: {
    id: 8,
    status: "COMPLETED" as const,
    createdDate: "2026-07-01T10:00:00Z",
    completedDate: "2026-07-01T12:00:00Z",
    consumer: {
      consumerId: 1064,
      consumerCid: "CID-1064",
      consumerName: "REENA UPADHYAY",
      ivrs: "3544019391",
      rrNumber: "3544019391",
      accountId: "N3008013701",
      servicePointId: "SP-1",
      address: "Sample Address",
      zone: "Zone A",
      office: "Office 1",
      consumerStatus: "ACTIVE" as const,
    },
    oldMeter: {
      meterLookupId: 100,
      meterSerial: "85080223",
      meterReading: "1000",
      meterStatus: "INACTIVE" as const,
    },
    newMeter: {
      meterLookupId: 200,
      meterSerial: "85081162",
      meterReading: "0",
      meterStatus: "ACTIVE" as const,
    },
    replacementReason: "Faulty",
    remarks: null,
    latitude: "22.7",
    longitude: "75.8",
    submittedBy: "qa.user",
  },
};

export const sampleCreateSubmissionSuccess = {
  success: true as const,
  data: { id: 99, status: "PENDING" },
};

export const sampleBulkValidateSuccess = {
  success: true as const,
  summary: { totalRows: 1, validRows: 1, invalidRows: 0 },
  rows: [{ row: 1, valid: true, errors: [] }],
};
