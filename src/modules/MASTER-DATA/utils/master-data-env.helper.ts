/** CI / local defaults — avoids skipping when .env omits stable hierarchy labels. */
export const MASTER_DATA_ENV_DEFAULTS: Record<string, string> = {
  CREATE_DTR_ORGANISATION_LOOKUP_ID: "30",
  CREATE_DTR_SUBSTATION_NETWORK_LOOKUP_ID: "3",
  CREATE_DTR_FEEDER_NETWORK_LOOKUP_ID: "4",
  CREATE_DTR_EXISTS_CODE: "RJ662",
  BULK_DTR_ZONE_NAME: "Hawabangla",
  BULK_DTR_SUBSTATION_NAME: "PragatiNagar",
  BULK_DTR_FEEDER_NAME: "PARMANU NAGAR(CHQ)",
  BULK_DTR_MAIN_SUB_METER: "Main",
  BULK_DTR_METER_PHASE: "1 PH",
  BULK_METER_MANUFACTURER_NAME: "L&T",
  CREATE_METER_DEVICE_MANUFACTURER_TBL_REF_ID: "2",
  CREATE_METER_METER_MODEL_TBL_REF_ID: "1",
  CREATE_DTR_MAIN_SUB_METER_TBL_REF_ID: "1",
  CREATE_DTR_METER_PHASE_TBL_REF_ID: "1",
  BULK_CONSUMER_DTR_NAME: "RJ662",
  BULK_CONSUMER_CATEGORY_NAME: "Commercial",
  BULK_CONSUMER_CONNECTION_STATUS_NAME: "Connected",
  BULK_CONSUMER_CONNECTION_TYPE_NAME: "Prepaid",
  BULK_CONSUMER_BILLING_CYCLE_NAME: "Monthly",
  BULK_CONSUMER_TOD_NAME: "NO TOD LT",
  CREATE_CONSUMER_ORGANISATION_LOOKUP_ID: "30",
  CREATE_CONSUMER_CATEGORY_TBL_REF_ID: "3",
  CREATE_CONSUMER_CONNECTION_STATUS_TBL_REF_ID: "1",
  CREATE_CONSUMER_METER_PHASE_TBL_REF_ID: "1",
  CREATE_CONSUMER_CONNECTION_TYPE_TBL_REF_ID: "1",
  CREATE_CONSUMER_BILLING_CYCLE_TBL_REF_ID: "1",
  CREATE_CONSUMER_TOD_TBL_REF_ID: "1",
  CREATE_CONSUMER_MAIN_SUB_METER_TBL_REF_ID: "1",
};

export function resolveMasterDataEnv(key: string): string {
  return process.env[key]?.trim() || MASTER_DATA_ENV_DEFAULTS[key] || "";
}

export function resolveMasterDataEnvInt(key: string, fallback = 0): number {
  const raw = resolveMasterDataEnv(key);
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function shouldSkipMasterDataTestForEnv(envKeys?: string[]): boolean {
  if (!envKeys?.length) {
    return false;
  }
  return envKeys.some((key) => !resolveMasterDataEnv(key));
}
