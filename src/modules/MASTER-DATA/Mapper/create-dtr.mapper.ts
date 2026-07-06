import type { CreateDtrRequestBody } from "../Data/create-dtr.data";

export interface CreateDtrResponseData {
  networkLookupId: number;
  meterLookupId: number;
  "DTR Code": string;
  "DTR Name": string;
  "DTR Capacity (KVA)": number;
  Status: string;
  MSN: string;
  organisationLookupId: number;
  feederNetworkLookupId: number;
  subStationNetworkLookupId: number;
  "Service Date"?: string;
  "Installation Date"?: string;
  Latitude?: string;
  Longitude?: string;
  "DTR Address"?: string;
  Remarks?: string;
}

export interface CreateDtrError {
  code: string;
  message: string;
  details?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[]>;
  };
}

export interface CreateDtrResponse {
  success: boolean;
  message?: string;
  data?: CreateDtrResponseData;
  error?: CreateDtrError;
}

export type CreateDtrScenario =
  | "success"
  | "validation_error"
  | "dtr_code_exists"
  | "meter_not_found"
  | "meter_inactive"
  | "meter_on_dtr"
  | "meter_assigned";

export interface CreateDtrMapped {
  success: boolean;
  message: string | null;
  data: CreateDtrResponseData | null;
  error: CreateDtrError | null;
  isCreateSuccess: boolean;
}

export const CREATE_DTR_SUCCESS_FIELDS = [
  "networkLookupId",
  "meterLookupId",
  "DTR Code",
  "DTR Name",
  "DTR Capacity (KVA)",
  "Status",
  "MSN",
  "organisationLookupId",
  "feederNetworkLookupId",
  "subStationNetworkLookupId",
] as const;

export const REQUEST_ECHO_FIELDS: Array<{
  requestKey: keyof CreateDtrRequestBody;
  responseKey: keyof CreateDtrResponseData;
}> = [
  { requestKey: "DTR Code", responseKey: "DTR Code" },
  { requestKey: "DTR Name", responseKey: "DTR Name" },
  { requestKey: "DTR Capacity (KVA)", responseKey: "DTR Capacity (KVA)" },
  { requestKey: "Status", responseKey: "Status" },
  { requestKey: "MSN", responseKey: "MSN" },
  { requestKey: "organisationLookupId", responseKey: "organisationLookupId" },
  {
    requestKey: "feederNetworkLookupId",
    responseKey: "feederNetworkLookupId",
  },
  {
    requestKey: "subStationNetworkLookupId",
    responseKey: "subStationNetworkLookupId",
  },
  { requestKey: "Service Date", responseKey: "Service Date" },
  { requestKey: "Installation Date", responseKey: "Installation Date" },
  { requestKey: "Latitude", responseKey: "Latitude" },
  { requestKey: "Longitude", responseKey: "Longitude" },
  { requestKey: "DTR Address", responseKey: "DTR Address" },
  { requestKey: "Remarks", responseKey: "Remarks" },
];

export class CreateDtrMapper {
  static map(response: CreateDtrResponse): CreateDtrMapped {
    const isCreateSuccess = response.success === true && response.data != null;
    return {
      success: response.success,
      message: response.message ?? null,
      data: response.data ?? null,
      error: response.error ?? null,
      isCreateSuccess,
    };
  }
}
