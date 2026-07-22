/** Minimal Aberration Entry (zone / EENLTMT) fixtures for mutation-proof. */
export const sampleAberrationEntryRow = {
  id: "1",
  circle: "INDORE CITY",
  division: "INDORE CITY CIRCLE",
  zone: "PALASIA",
  subStation: "SS-1",
  feeder: "FEEDER-1",
  dtr: "DTR-1",
  name: "Sample Consumer",
  address: "Sample Address",
  ivrsNo: "1234567",
  meterSerialNo: "MSN001",
  eventName: "Cover Open",
  occurrenceTime: "22 Jan 2026, 12:00 am",
  restorationTime: "",
  remarks: "Sample",
  amountBilled: 2800,
  amountRealised: 1500,
  fieldOfficerRemarks: "",
  fieldOfficerName: "Officer",
  fieldOfficerDesignation: "JE",
  mrTransactionNo: "MR-001",
  p4No: "P4-001",
  p4Date: "10-07-2026",
  inspectionDate: "10-07-2026",
  entryDate: "10 Jul 2026, 1:38 pm",
  month: "January",
  year: "2026",
};

export const sampleAberrationEntryColumns = [
  { key: "circle", header: "Circle" },
  { key: "ivrsNo", header: "IVRS No." },
  { key: "amountBilled", header: "Amount Billed" },
];

export const sampleAberrationEntrySuccessResponse = {
  success: true as const,
  data: {
    columns: sampleAberrationEntryColumns,
    rows: [sampleAberrationEntryRow],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  },
};

export const sampleAberrationEntryDataForPagination = {
  columns: sampleAberrationEntryColumns,
  rows: Array.from({ length: 10 }, (_, index) => ({
    ...sampleAberrationEntryRow,
    id: String(index + 1),
  })),
  pagination: { page: 1, limit: 10, total: 25, totalPages: 3 },
};
