export const lfAnalysisData = {
  month: 12,
  year: 2025,
  threshold: 5,
  operator: "lt" as const,
  months: 1,
  page: 1,
  pageSize: 100,
};

export const lfAnalysisGt100Data = {
  month: 12,
  year: 2025,
  threshold: 100,
  operator: "gt" as const,
  months: 1,
  page: 1,
  pageSize: 100,
};

export const lfAnalysisLt5Last3mData = {
  month: 12,
  year: 2025,
  threshold: 5,
  operator: "lt" as const,
  months: 3,
  page: 1,
  pageSize: 100,
};

export const lfAnalysisLt5Last6mData = {
  month: 12,
  year: 2025,
  threshold: 5,
  operator: "lt" as const,
  months: 6,
  page: 1,
  pageSize: 100,
};
