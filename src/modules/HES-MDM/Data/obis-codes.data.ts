/** HES-MDM Integration doc §2 — OBIS codes for metering profiles */
export const hesObisCodes = {
  nameplateProfile: "0.0.94.91.10.255",
  instantaneousProfile: "1.0.94.91.0.255",
  blockLoadProfile: "1.0.99.1.0.255",
  dailyLoadProfile: "1.0.99.2.0.255",
  billingProfile: "1.0.98.1.0.255",
  eventCurrent: "0.0.99.98.1.255",
  eventVoltage: "0.0.99.98.0.255",
  eventPower: "0.0.99.98.2.255",
  eventTransaction: "0.0.99.98.3.255",
  eventOthers: "0.0.99.98.4.255",
  eventNonRollover: "0.0.99.98.5.255",
  eventControl: "0.0.99.98.6.255"
} as const;

export type HesObisProfile = keyof typeof hesObisCodes;
