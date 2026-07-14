export const consumerDetailData = {

  // Happy Path
  consumerId: 1064,

  // Negative Scenarios
  invalidConsumerId: 99999999,

  negativeConsumerId: -1,

  zeroConsumerId: 0,

  decimalConsumerId: 55.5,

  // Edge Cases
  maxIntegerConsumerId: Number.MAX_SAFE_INTEGER,

  minIntegerConsumerId: Number.MIN_SAFE_INTEGER,

  stringConsumerId: "ABC",

  specialCharacterConsumerId: "@#$%",

  sqlInjectionConsumerId: "' OR 1=1 --",

  xssConsumerId: "<script>alert('x')</script>",

  unicodeConsumerId: "తెలుగు",

  emojiConsumerId: "😀😀😀",

  whitespaceConsumerId: "   ",

  emptyConsumerId: "",

  nullConsumerId: null,

  undefinedConsumerId: undefined,

  maxResponseTime: 60_000,
};