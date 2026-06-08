export const validateMeterData = {
    meterSerialNumber: "85080223",
    organisationLookupId: 19,
    maxResponseTime: 60_000,
    /** Live test data: assigned meter returns invalid with this reason. */
    expectedValid: false,
    expectedReason: "METER_ALREADY_ASSIGNED",
};
