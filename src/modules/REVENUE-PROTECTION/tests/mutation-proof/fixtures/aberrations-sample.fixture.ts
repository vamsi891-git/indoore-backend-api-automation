/** Minimal Aberrations summary fixtures for mutation-proof. */
export const sampleAberrationRow = {
  id: "1",
  circle: "INDORE CITY",
  month: "FEB",
  year: "2025",
  noOfCases: 10,
  totalCasesAttended: 7,
  pending: 3,
  amountBilled: 5000,
  amountRealisation: 2000,
};

export const sampleAberrationsColumns = [
  { key: "circle", header: "Circle" },
  { key: "month", header: "Month" },
  { key: "year", header: "Year" },
  { key: "noOfCases", header: "No Of Cases" },
  { key: "totalCasesAttended", header: "Total Cases Attended" },
  { key: "pending", header: "Pending" },
  { key: "amountBilled", header: "Amount Billed" },
  { key: "amountRealisation", header: "Amount Realisation" },
];

export const sampleAberrationsSuccessResponse = {
  success: true as const,
  data: {
    columns: sampleAberrationsColumns,
    rows: [sampleAberrationRow],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  },
};

export const sampleAberrationsDataForPagination = {
  columns: sampleAberrationsColumns,
  rows: Array.from({ length: 10 }, (_, index) => ({
    ...sampleAberrationRow,
    id: String(index + 1),
  })),
  pagination: { page: 1, limit: 10, total: 25, totalPages: 3 },
};
