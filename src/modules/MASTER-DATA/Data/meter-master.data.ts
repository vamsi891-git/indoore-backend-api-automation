export const EXPECTED_METER_MASTER_COLUMNS = [
  { key: "slNo", header: "Sl No." },
  { key: "meterSerialNumber", header: "Meter SL No." },
  { key: "meterRapdrpCode", header: "Meter RAPDRP Code" },
  { key: "assetId", header: "Asset ID" },
  { key: "mf", header: "MF" },
  { key: "simNumber", header: "SIM Number" },
  { key: "ismiNumber", header: "IMSI Number" },
  { key: "ipAddress", header: "IP Address" },
  { key: "modemSerialNumber", header: "Modem Serial No." },
  { key: "modemImeiNumber", header: "Modem IMEI No." },
  { key: "isActiveStatus", header: "Status" },
] as const;

export const meterMasterDefaultQuery = {
  page: 1,
  limit: 20,
} as const;

export const meterMasterPage2Query = {
  page: 2,
  limit: 20,
} as const;

export const meterMasterSmallPageQuery = {
  page: 1,
  limit: 10,
} as const;

export const meterMasterMaxResponseTimeMs = 120_000;
