export interface ConsumerProfileResponse {
    success: boolean;
    data?: any;
    error?: {
        code: string;
        message: string;
    };
}
export class ConsumerProfileMapper {
    static map(response:ConsumerProfileResponse) {
        const data = response.data ?? {};
        const occupancyStatus =
            data.occupancyStatus ??
            data.occupancy ??
            data.occupancyType ??
            data.occupancy_status ??
            null;
        return {
            consumerName:data.consumerName ?? "",
            consumerEmail:data.consumerEmail ?? null,
            consumerNumber:data.consumerNumber ?? "",
            uniqueId:data.uniqueId ?? "",
            meterSerialNumber:data.meterSerialNumber ?? "",
            occupancyStatus,
            permanentAddress:data.permanentAddress ?? "",
            billingAddress:data.billingAddress ?? "",
            connectionDetails:data.connectionDetails ?? {},
            connectionMeterDetails:data.connectionMeterDetails ?? {},
            latestActivities:data.latestActivities ?? []
        };
    }
}