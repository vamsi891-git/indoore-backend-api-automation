export const submissionHistoryData = {

  // -----------------------------
  // Happy Path
  // -----------------------------

  page: 1,
  limit: 20,
  // -----------------------------
  // Search
  // -----------------------------
  validSearch: "REENA",
  invalidSearch: "UNKNOWN_CONSUMER_999",
  consumerSearch: "REENA UPADHYAY",
  meterSearch: "85080223",
  // -----------------------------
  // Status Filters
  // ----------------------------

  pendngStatus: "PENDING",
  completedStatus: "COMPLETED",
  invalidStatus: "INVALID",
  // -----------------------------
  // Date Filters
  // -----------------------------
  validDateFrom: "2026-07-01",
  vaidDateTo: "2026-07-31",
  invalidDate: "2026-99-99",

  // -----------------------------
  // Pagination
  // -----------------------------

  firstPage: 1,

  secondPage: 2,
  lastPage: 999,
  zeroPage: 0,
  negtivePage: -1,
  decimalPage: 1.5,
  // -----------------------------
  // Limit
  // -----------------------------
  minimumLimit: 1,
  defaultLimit: 20,
  maximumLimit: 100,
  zeroLimit: 0,
  negativeLimit: -20,
  largeLimit: 1000,
  decimalLimit: 20.5,

  // -----------------------------
  // Injection
  // -----------------------------
  sqlInjection: "' OR 1=1 --",
  xssInjection: "<script>alert('x')</script>",
  specialCharacters: "@#$%^&*",
  unicodeSearch: "తెలుగు",
  emojiSearch: "😀😀😀",
  whitespaceSearch: "     ",
  emptySearch: "",
  // -----------------------------
  // Performance
  // -----------------------------
  maxResponseTime: 60_000,
};