export type CreateConsumerRequestBody = Record<string, string | number | boolean>;

const baseTemplate: CreateConsumerRequestBody = {
    "Consumer Name": "Ramesh Kumar",
    "Father Name": "Suresh Kumar",
    "Email ID": "ramesh@example.com",
    "Mobile No.": "9876543210",
    "Land Line No.": "0731-2551234",
    "Address": "12 MG Road, Indore",
    "Pin Code": "452001",
    "Sub Station": "SS-Indore-North",
    "Feeder": "Feeder-12",
    "DTR": "DTR-45",
    "Nearest Acct. ID": "ACC-49999",
    "Total Demand (KVA)": 5,
    "Sanctioned Load (KW)": 4,
    "Sanctioned Load (HP)": 5.5,
    "Connected KVA": 4,
    "Connected KW": 3.5,
    "Connected HP": 4.5,
    "Rated KVA": 5,
    "Rated KW": 4,
    "Connection Type": 1,
    "Billing Cycle": 1,
    "Bill Day": 5,
    "Consumer Category": 3,
    "Nature Of Business": "Commercial",
    "Connection Status": 1,
    "TOD": 1,
    "MR Code": "MR01",
    "Main/Sub Meter": 1,
    "Service Point ID": "SP-001",
    "Date Of Service": "2026-06-01",
    "Meter Phase": 1,
    "Connected To DCU": true,
    "SIM No.": "8991001234567890123",
    "IMSI No.": "404123456789012",
    "Mobile No. (Meter)": "9876501234",
    "IP Address": "10.0.0.15",
    "Modem Serial Number": "MOD-9988",
    "Modem IMEI": "359633100000000",
    "Meter Initial Reading": 0,
    "Connected Phase": "R",
    "Is Net Meter": false,
    "Activate/Deactivate Remarks": "New connection",
};

export const createConsumerData = {
    maxResponseTime: 60_000,
    expectedSuccessMessage: "Consumer created successfully",
    organisationLookupId: Number(process.env.CREATE_CONSUMER_ORGANISATION_LOOKUP_ID ?? 19),
    meterSerialNumber: process.env.CREATE_CONSUMER_MSN ?? "85080223",
    connectionTypeId: 1,
    consumerCategoryId: 3,
    connectionStatusId: 1,
    profileQuery: {
        billingLimit: 12,
        eventPage: 1,
        eventPageSize: 20,
    },
};

export function buildCreateConsumerRequest(
    suffix: string = String(Date.now()),
): CreateConsumerRequestBody {
    return {
        ...baseTemplate,
        "Consumer ID": `CID-AUTO-${suffix}`,
        "IVRS Number": `IVRS-AUTO-${suffix}`,
        "Account ID": `ACC-AUTO-${suffix}`,
        // Unique contact fields — 409 with fresh IDs is almost always the meter (MSN), not these.
        "Email ID": `ramesh.auto.${suffix}@example.com`,
        "Mobile No.": `98765${String(suffix).slice(-5).padStart(5, "0")}`,
        "MSN": createConsumerData.meterSerialNumber,
        "Connection Type": createConsumerData.connectionTypeId,
        "Consumer Category": createConsumerData.consumerCategoryId,
        "Connection Status": createConsumerData.connectionStatusId,
        ...(process.env.CREATE_CONSUMER_NETWORK_LOOKUP_ID
            ? {
                  "Network Lookup ID": Number(
                      process.env.CREATE_CONSUMER_NETWORK_LOOKUP_ID,
                  ),
              }
            : {}),
        ...(process.env.CREATE_CONSUMER_METER_LOOKUP_ID
            ? {
                  "Meter Lookup ID": Number(
                      process.env.CREATE_CONSUMER_METER_LOOKUP_ID,
                  ),
              }
            : {}),
        ...(process.env.CREATE_CONSUMER_ORGANISATION_LOOKUP_ID
            ? {
                  "Organisation Lookup ID": Number(
                      process.env.CREATE_CONSUMER_ORGANISATION_LOOKUP_ID,
                  ),
              }
            : {}),
    };
}
