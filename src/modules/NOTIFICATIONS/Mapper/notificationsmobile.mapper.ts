export interface MobileNotificationSendData {
    consumerCid: string;
    notificationType: string;
    totalRecipients: number;
    delivered: number;
    skipped: number;
    invalidMobiles: string[];
    dispatchStatus: string;
    dispatchMode: string;
    failedBatches: number;
}

export interface MobileNotificationSendResponse {
    success: boolean;
    message: string;
    data: MobileNotificationSendData;
}

export class NotificationsMobileMapper {
    static map(response: any): MobileNotificationSendResponse {
        const data = response.data ?? {};

        return {
            success: response.success,
            message: response.message,
            data: {
                consumerCid: data.consumerCid,
                notificationType: data.notificationType,
                totalRecipients: data.totalRecipients,
                delivered: data.delivered,
                skipped: data.skipped,
                invalidMobiles: data.invalidMobiles ?? [],
                dispatchStatus: data.dispatchStatus,
                dispatchMode: data.dispatchMode,
                failedBatches: data.failedBatches,
            },
        };
    }
}
