export const progressData = {
  // -----------------------------
  // Performance
  // -----------------------------

  maxResponseTime: 60_000,

  // -----------------------------
  // Expected Chart Contract
  // -----------------------------

  weeklyBucketCount: 7,
  monthlyBucketCount: 5,

  expectedWeeklyLabels: [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ] as const,

  expectedMonthlyLabels: [
    "Week 1",
    "Week 2",
    "Week 3",
    "Week 4",
    "Week 5",
  ] as const,

  // -----------------------------
  // Boundary Values
  // -----------------------------

  minimumCount: 0,
  maximumSafeInteger: Number.MAX_SAFE_INTEGER,

  // -----------------------------
  // Edge / Query Pollution
  // -----------------------------

  ignoredQueryParams: {
    period: "weekly",
    foo: "bar",
    page: 1,
    limit: 20,
    status: "COMPLETED",
  },

  sqlInjectionQuery: "' OR 1=1 --",
  xssQuery: "<script>alert('x')</script>",
  unicodeQuery: "తెలుగు",
  emojiQuery: "😀😀😀",
  whitespaceQuery: "     ",
  emptyQuery: "",
  longQuery: "a".repeat(500),

  // -----------------------------
  // Negative Auth / Methods
  // -----------------------------

  expectedUnauthorizedStatus: 401,
  expectedUnauthorizedCode: "UNAUTHORIZED",
  expectedInvalidTokenCode: "ACCESS_TOKEN_INVALID",

  disallowedMethods: [
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ] as const,

  invalidBearerToken: "Bearer invalid.token.value",
  malformedBearerToken: "not-a-bearer-token",
  emptyBearerToken: "Bearer ",
};
