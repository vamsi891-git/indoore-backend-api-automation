/** Minimal ATR Zone fixtures for mutation-proof (not live API data). */
export const sampleAtrZoneRow = {
  id: "1",
  circle: "INDORE CITY",
  division: "INDORE CITY CIRCLE",
  zone: "PALASIA",
  feeder: "FEEDER-1",
  dtr: "DTR-1",
  feeder1: "FEEDER1",
  dtr1: "DTR1",
  ivrs: "1234567",
  meterSerialNumber: "MSN001",
  eventName: "Cover Open",
  eventCategory: "",
  occurrenceTime: "28 Apr 2026, 12:00 am",
  restorationTime: "",
  remarks: "Sample",
  amountBilled: 2800,
  amountRealised: 1500,
  fieldRemarks: "",
  p4Number: "P4-001",
  p4Date: "10-07-2026",
  entryDateTime: "10 Jul 2026, 1:38 pm",
  year: "2026",
  month: "APR",
};

export const sampleAtrZoneColumns = [
  { key: "year", header: "Year" },
  { key: "month", header: "Month" },
  { key: "circle", header: "Circle" },
  { key: "amountBilled", header: "Amount Billed" },
];

export const sampleAtrZoneSuccessResponse = {
  success: true as const,
  data: {
    columns: sampleAtrZoneColumns,
    rows: [sampleAtrZoneRow],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  },
};

export const sampleAtrZoneDataForPagination = {
  columns: sampleAtrZoneColumns,
  rows: Array.from({ length: 10 }, (_, index) => ({
    ...sampleAtrZoneRow,
    id: String(index + 1),
  })),
  pagination: { page: 1, limit: 10, total: 25, totalPages: 3 },
};
