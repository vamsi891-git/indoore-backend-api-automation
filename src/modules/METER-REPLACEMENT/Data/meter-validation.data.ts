/**
 * Known meter in L_Meter_Lookup. May be ineligible for replacement
 * (mapped / active request) but still returns a stable identity for
 * structure + trim tests. Prefer create-submission E2E for valid:true.
 */
const KNOWN_METER_SERIAL =
  process.env.METER_REPLACEMENT_VALIDATE_SERIAL?.trim() || "85081162";

export const meterValidationData = {
  // Happy Path / known identity
  validMeterSerial: KNOWN_METER_SERIAL,

  // Meter does not exist
  invalidMeterSerial: "999999999999",

  // Invalid Formats
  alphaMeterSerial: "ABCDEFGH",

  alphaNumericMeterSerial: "ABC12345",

  specialCharacterMeterSerial: "@#$%^&*",

  sqlInjectionMeterSerial: "' OR 1=1 --",

  xssMeterSerial: "<script>alert('x')</script>",

  unicodeMeterSerial: "తెలుగు",

  emojiMeterSerial: "😀😀😀",

  // Edge Cases
  emptyMeterSerial: "",

  whitespaceMeterSerial: "     ",

  leadingSpaceMeterSerial: `   ${KNOWN_METER_SERIAL}`,

  trailingSpaceMeterSerial: `${KNOWN_METER_SERIAL}   `,

  veryLongMeterSerial: "12345678901234567890123456789012345678901234567890",

  singleDigitMeterSerial: "1",

  zeroMeterSerial: "0",

  numericStringMeterSerial: KNOWN_METER_SERIAL,

  maxResponseTime: 60_000,
};
