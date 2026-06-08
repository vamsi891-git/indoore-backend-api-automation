import { CreateConsumerRequestBody } from "../Data/createconsumer.data";

export type CreateConsumerResponseData = Record<
    string,
    string | number | boolean | null
>;

export interface CreateConsumerError {
    code: string;
    message: string;
    details?: unknown;
}

export interface CreateConsumerResponse {
    success: boolean;
    message?: string;
    data?: CreateConsumerResponseData;
    error?: CreateConsumerError;
}

export interface CreateConsumerMapped {
    success: boolean;
    message: string | null;
    data: CreateConsumerResponseData | null;
    error: CreateConsumerError | null;
    isCreateSuccess: boolean;
}

export const CREATE_SUCCESS_FIELDS = [
    "Consumer ID",
    "Consumer Name",
    "Mobile No.",
    "Address",
    "IVRS Number",
    "Account ID",
    "MSN",
] as const;

export const REQUEST_ECHO_FIELDS: Array<{
    requestKey: keyof CreateConsumerRequestBody | string;
    responseKey: string;
}> = [
    { requestKey: "Consumer ID", responseKey: "Consumer ID" },
    { requestKey: "Consumer Name", responseKey: "Consumer Name" },
    { requestKey: "Father Name", responseKey: "Father Name" },
    { requestKey: "Email ID", responseKey: "Email ID" },
    { requestKey: "Mobile No.", responseKey: "Mobile No." },
    { requestKey: "Land Line No.", responseKey: "Land Line No." },
    { requestKey: "Address", responseKey: "Address" },
    { requestKey: "Pin Code", responseKey: "Pin Code" },
    { requestKey: "Sub Station", responseKey: "Sub Station" },
    { requestKey: "Feeder", responseKey: "Feeder" },
    { requestKey: "DTR", responseKey: "DTR" },
    { requestKey: "IVRS Number", responseKey: "IVRS Number" },
    { requestKey: "Account ID", responseKey: "Account ID" },
    { requestKey: "Nearest Acct. ID", responseKey: "Nearest Acct. ID" },
    { requestKey: "Sanctioned Load (KW)", responseKey: "Sanctioned Load (KW)" },
    { requestKey: "MR Code", responseKey: "MR Code" },
    { requestKey: "MSN", responseKey: "MSN" },
    { requestKey: "Service Point ID", responseKey: "Service Point ID" },
    { requestKey: "Date Of Service", responseKey: "Date Of Service" },
    { requestKey: "Nature Of Business", responseKey: "Nature Of Business" },
    { requestKey: "Bill Day", responseKey: "Bill Day" },
    { requestKey: "Connected Phase", responseKey: "Connected Phase" },
    {
        requestKey: "Activate/Deactivate Remarks",
        responseKey: "Activate/Deactivate Remarks",
    },
];

export class CreateConsumerMapper {
    static map(response: CreateConsumerResponse): CreateConsumerMapped {
        const status = response.success === true && response.data != null;
        return {
            success: response.success,
            message: response.message ?? null,
            data: response.data ?? null,
            error: response.error ?? null,
            isCreateSuccess: status,
        };
    }
}
