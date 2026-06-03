export interface ConsumerProfileResponse {
    success: boolean;
    data: any;
}
export class ConsumerProfileMapper {
    static map(response:ConsumerProfileResponse) {
        const data =response.data;
        return {
            consumerName:data.consumerName,
            consumerEmail:data.consumerEmail,
            consumerNumber:data.consumerNumber,
            uniqueId:data.uniqueId,
            meterSerialNumber:data.meterSerialNumber,
            occupancyStatus:data.occupancyStatus,
            permanentAddress:data.permanentAddress,
            billingAddress:data.billingAddress,
            connectionDetails:data.connectionDetails,
            connectionMeterDetails:data.connectionMeterDetails,
            latestActivities:data.latestActivities
        };
    }
}