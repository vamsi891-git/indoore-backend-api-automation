export interface ConsumerMeterStatusDataModel {
    totalConsumerMeters: number;
    communicatedConsumerMeters: number;
    nonCommunicatedConsumerMeters: number;
}

export interface ConsumerMeterStatusResponse {
    success: boolean;
    data?: ConsumerMeterStatusDataModel | null;
    message?: string;
}

export interface MappedConsumerMeterStatus extends ConsumerMeterStatusDataModel {
    success: boolean;
}

function toCount(value: unknown): number {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
}

export class ConsumerMeterStatusMapper {
    static map(response: ConsumerMeterStatusResponse): MappedConsumerMeterStatus {
        const data = response.data;
        return {
            success: Boolean(response.success),
            totalConsumerMeters: toCount(data?.totalConsumerMeters),
            communicatedConsumerMeters: toCount(data?.communicatedConsumerMeters),
            nonCommunicatedConsumerMeters: toCount(
                data?.nonCommunicatedConsumerMeters,
            ),
        };
    }
}
