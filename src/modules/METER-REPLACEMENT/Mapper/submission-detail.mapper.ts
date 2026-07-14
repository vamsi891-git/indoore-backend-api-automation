export type SubmissionStatus =
    | "PENDING"
    | "COMPLETED";

export type MeterStatus =
    | "ACTIVE"
    | "INACTIVE"
    | "UNKNOWN";

export type ConsumerStatus =
    | "ACTIVE"
    | "INACTIVE";

export interface SubmissionConsumer {
    consumerId: number;
    consumerCid: string;
    consumerName: string;
    ivrs: string;
    rrNumber: string;
    accountId: string;
    servicePointId: string;
    address: string;
    zone: string;
    office: string;
    consumerStatus: ConsumerStatus;
}
export interface SubmissionMeter {
    meterLookupId: number | null;
    meterSerial: string;
    meterReading: string | null;
    meterStatus: MeterStatus;
}
export interface SubmissionDetailData {
    id: number;
    status: SubmissionStatus;
    createdDate: string;
    completedDate: string | null;
    consumer: SubmissionConsumer;
    oldMeter: SubmissionMeter;
    newMeter: SubmissionMeter;
    replacementReason: string | null;
    remarks: string | null;
    latitude: string | null;
    longitude: string | null;
    submittedBy: string;
}

export interface SubmissionDetailResponse {
    success: boolean;
    data: SubmissionDetailData;

}
export class SubmissionDetailMapper {

    static map(response: SubmissionDetailResponse,): SubmissionDetailData & { success: boolean } {
        const data = response.data ??({} as SubmissionDetailData);
        return {
            success: response.success,
            id: data.id ?? 0,
            status:data.status ?? "PENDING",
            createdDate:data.createdDate?.trim() ?? "",
            completedDate:data.completedDate?.trim() ?? null,
            consumer: {
                consumerId:data.consumer?.consumerId ?? 0,
                consumerCid:data.consumer?.consumerCid?.trim() ?? "",
                consumerName:data.consumer?.consumerName?.trim() ?? "",
                ivrs:data.consumer?.ivrs?.trim() ?? "",
                rrNumber:data.consumer?.rrNumber?.trim() ?? "",
                accountId:data.consumer?.accountId?.trim() ?? "",
                servicePointId:data.consumer?.servicePointId?.trim() ?? "",
                address:data.consumer?.address?.trim() ?? "",
                zone:data.consumer?.zone?.trim() ?? "",
                office:data.consumer?.office?.trim() ?? "",
                consumerStatus:data.consumer?.consumerStatus ?? "INACTIVE",
            },
            oldMeter: {
                meterLookupId:data.oldMeter?.meterLookupId ?? null,
                meterSerial:data.oldMeter?.meterSerial?.trim() ?? "",
                meterReading:data.oldMeter?.meterReading?.trim() ?? null,
                meterStatus:data.oldMeter?.meterStatus ??"UNKNOWN",
            },
            newMeter: {
                meterLookupId:data.newMeter?.meterLookupId ?? null,
                meterSerial:data.newMeter?.meterSerial?.trim() ?? "",
                meterReading:data.newMeter?.meterReading?.trim() ?? null,
                meterStatus:data.newMeter?.meterStatus ??"UNKNOWN",
            },
            replacementReason:data.replacementReason?.trim() ?? null,
            remarks:data.remarks?.trim() ?? null,
            latitude:data.latitude?.trim() ?? null,
            longitude:data.longitude?.trim() ?? null,
            submittedBy:data.submittedBy?.trim() ?? "",
        };
    }
}