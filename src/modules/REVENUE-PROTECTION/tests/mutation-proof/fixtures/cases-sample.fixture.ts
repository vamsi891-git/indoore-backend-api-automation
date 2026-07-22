/**
 * Shared Cases fixture for mutation-proof tests.
 * Structural shape matches CaseRowSchema / CasesSuccessResponseSchema —
 * values are synthetic (not live API data).
 */
export const sampleCaseRow = {
  id: "1",
  circle: "INDORE CITY",
  division: "INDORE CITY CIRCLE",
  zone: "PALASIA",
  year: "2026",
  month: "JUL",
  consumerName: "Sample Consumer",
  address: "Sample Address",
  msn: "MSN001",
  category: "DOMESTIC",
  phase: "1",
  ivrsNo: "1234567",
  remarks: "Sample remarks",
  event: "Cover Open",
  amountBilled: 2800,
  amountRealisation: 1500,
  p4Number: "P4-001",
  p4Date: "10-07-2026",
  entryDateTime: "10 Jul 2026, 1:38 pm",
  status: "Open" as const,
};

export const sampleCaseColumns = [
  { key: "circle", header: "Circle" },
  { key: "division", header: "Division" },
  { key: "zone", header: "Zone" },
  { key: "year", header: "Year" },
  { key: "month", header: "Month" },
  { key: "consumerName", header: "Name" },
  { key: "address", header: "Address" },
  { key: "msn", header: "MSN" },
  { key: "category", header: "Category" },
  { key: "phase", header: "Phase" },
  { key: "ivrsNo", header: "IVRS No." },
  { key: "remarks", header: "Remarks" },
  { key: "event", header: "Event" },
  { key: "amountBilled", header: "Amount Billed" },
  { key: "amountRealisation", header: "Amount Realisation" },
  { key: "p4Number", header: "P4 Number" },
  { key: "p4Date", header: "P4 Date" },
  { key: "entryDateTime", header: "Entry DateTime" },
  { key: "status", header: "Status" },
];

export const sampleCasesSuccessResponse = {
  success: true as const,
  data: {
    columns: sampleCaseColumns,
    rows: [sampleCaseRow],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  },
};

export const sampleCasesDataForPagination = {
  columns: sampleCaseColumns,
  rows: Array.from({ length: 10 }, (_, index) => ({
    ...sampleCaseRow,
    id: String(index + 1),
  })),
  pagination: {
    page: 1,
    limit: 10,
    total: 25,
    totalPages: 3,
  },
};
