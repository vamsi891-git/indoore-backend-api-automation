export interface ConsumerActivationResponse {
    success: boolean;
    data: {
        consumer: {
            cid: string;
            tblRefId: number;
            name: string;
            status: string;
        };
        previousStatus: string;
    };
}
export class ActivationMapper {
    static map(response: ConsumerActivationResponse) {
        return {
            consumer: response.data.consumer,
            previousStatus: response.data.previousStatus
        };
    }
}