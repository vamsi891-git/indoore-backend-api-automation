export type ConsumerActivationStatus = "active" | "inactive";

export interface ActivationConsumer {
    cid: string;
    tblRefId: number;
    name: string;
    status: ConsumerActivationStatus | string;
}

export interface ActivationData {
    consumer: ActivationConsumer;
    previousStatus: ConsumerActivationStatus | string;
}

export interface ConsumerActivationResponse {
    success: boolean;
    data: ActivationData;
}

export class ActivationMapper {
    static map(response: ConsumerActivationResponse): ActivationData & {
        success: boolean;
    } {
        const data = response.data ?? ({} as ActivationData);
        return {
            success: response.success,
            consumer: data.consumer ?? {
                cid: "",
                tblRefId: 0,
                name: "",
                status: "",
            },
            previousStatus: data.previousStatus ?? "",
        };
    }
}
