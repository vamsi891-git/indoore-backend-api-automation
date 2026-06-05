import { TimedApiClient } from "../../../core/base/timed-api.client";
import { ApiCallResult } from "../../../core/models/api-result.model";

export class NotificationsApi extends TimedApiClient {
    getNotifications(page: number, limit: number): Promise<ApiCallResult> {
        return this.getJson(`/indore/notifications?page=${page}&limit=${limit}`);
    }

    getNotificationStats(): Promise<ApiCallResult> {
        return this.getJson(`/indore/notifications/stats`);
    }

    markNotificationRead(notificationId: string): Promise<ApiCallResult> {
        return this.putJson(`/indore/notifications/${notificationId}/read`);
    }

    markAllNotificationsRead(): Promise<ApiCallResult> {
        return this.putJson(`/indore/notifications/mark-all-read`);
    }

    deleteNotification(notificationId: string): Promise<ApiCallResult> {
        return this.deleteJson(`/indore/notifications/${notificationId}`);
    }

    createNotification(payload: Record<string, unknown>): Promise<ApiCallResult> {
        return this.postJson("/indore/notifications", { data: payload });
    }

    triggerNotificationViaProfileUpdate(
        userId: string,
    ): Promise<ApiCallResult> {
        return this.patchJson(`/indore/users/${userId}`, {
            data: {
                designation: `QA Automation ${Date.now()}`,
            },
        });
    }

    sendMobileNotification(
        consumerCid: string,
        notificationType: string,
        message: string,
    ): Promise<ApiCallResult> {
        return this.postJson("/indore/notifications/mobile/send", {
            params: { consumerCid, notificationType, message },
        });
    }
}
