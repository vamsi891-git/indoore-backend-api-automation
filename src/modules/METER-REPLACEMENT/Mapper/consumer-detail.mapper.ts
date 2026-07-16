export type MeterStatus = "ACTIVE" | "INACTIVE";
export type ConsumerStatus = "ACTIVE" | "INACTIVE";

export interface ConsumerDetail {
  data: any;
  consumer: string;
  ivrs: string;
  rrNumber: string;
  consumerId: number;
  consumerCid: string;
  accountId: string;
  servicePointId: string;
  address: string;
  zone: string;
  office: string;
  oldMeterLookupId: number;
  oldMeterSerial: string;
  oldMeterStatus: MeterStatus;
  latitude: string;
  longitude: string;
  consumerStatus: ConsumerStatus;
  replacementEligible: boolean;
}

export interface ConsumerDetailResponse {
  success: boolean;
  data: ConsumerDetail;
}

export class ConsumerDetailMapper {
  static map(response: ConsumerDetailResponse): ConsumerDetail {
    const data = response.data ?? ({} as ConsumerDetail);
    return {
      consumer: data.consumer?.trim() ?? "",
      ivrs: data.ivrs?.trim() ?? "",
      rrNumber: data.rrNumber?.trim() ?? "",
      consumerId: data.consumerId,
      consumerCid: data.consumerCid?.trim() ?? "",
      accountId: data.accountId?.trim() ?? "",
      servicePointId: data.servicePointId?.trim() ?? "",
      address: data.address?.trim() ?? "",
      zone: data.zone?.trim() ?? "",
      office: data.office?.trim() ?? "",
      oldMeterLookupId: data.oldMeterLookupId,
      oldMeterSerial: data.oldMeterSerial?.trim() ?? "",
      oldMeterStatus: data.oldMeterStatus,
      latitude: data.latitude?.trim() ?? "",
      longitude: data.longitude?.trim() ?? "",
      consumerStatus: data.consumerStatus,
      replacementEligible: data.replacementEligible,
    };
  }
}
