export const submissionDetailData = {

  // -----------------------------
  // Happy Path
  // -----------------------------

  submissionId: 8,

  // -----------------------------
  // Invalid IDs
  // -----------------------------

  invalidSubmissionId: 999999,

  zeroSubmissionId: 0,

  negativeSubmissionId: -1,

  decimalSubmissionId: 10.5,

  // -----------------------------
  // Boundary Values
  // -----------------------------

  minimumSubmissionId: 1,

  maximumSubmissionId: Number.MAX_SAFE_INTEGER,

  // -----------------------------
  // Invalid Inputs
  // -----------------------------

  alphaSubmissionId: "ABC",

  alphaNumericSubmissionId: "123ABC",

  specialCharacterId: "@#$%^",

  sqlInjectionId: "' OR 1=1 --",

  xssInjectionId: "<script>alert('x')</script>",

  unicodeId: "తెలుగు",

  emojiId: "😀😀😀",

  whitespaceId: "     ",

  emptyId: "",

  // -----------------------------
  // Performance
  // -----------------------------

  maxResponseTime: 60_000,
};