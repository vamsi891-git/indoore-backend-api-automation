export const EXPECTED_METER_MASTER_COLUMNS = [
  { key: "slNo", header: "Sl No." },
  { key: "meterLookupTblRefId", header: "MeterLookup_TblRefID" },
  { key: "meterSerialNumber", header: "Meter_Serial_Number" },
  { key: "simNumber", header: "SIM_Number" },
  { key: "ismiNumber", header: "ISMI_Number" },
  { key: "ipAddress", header: "IPAddress" },
  { key: "modemSerialNumber", header: "Modem_Serial_Number" },
  { key: "modemImeiNumber", header: "Modem_IEMI_Number" },
  { key: "organisationLookupTblRefId", header: "OrganisationLookup_TblRefID" },
  { key: "networkLookupTblRefId", header: "NetworkLookup_TblRefID" },
  { key: "isActiveStatus", header: "IsActiveStatus" },
  { key: "assetId", header: "AssetID" },
  { key: "meterRapdrpCode", header: "Meter_RAPDRPCode" },
  { key: "mf", header: "MF" },
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
