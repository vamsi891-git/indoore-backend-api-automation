export interface Notification {
    id: string;
    title: string;
    message: string;
    notificationType: string;
    priority: string;
    isRead: boolean;
    readAt: string | null;
    redirectUrl: string | null;
    meta: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationStats {
    total: number;
    unread: number;
    read: number;
}

export interface NotificationsListData {
    notifications: Notification[];
    total: number;
}

export class NotificationsMapper {
    static mapNotifications(response: any): Notification[] {
        return this.mapNotificationsList(response).notifications;
    }

    static mapNotificationsList(response: any): NotificationsListData {
        const notifications = response.data?.notifications ?? [];
        const total = response.data?.pagination?.total ?? notifications.length;

        return { notifications, total };
    }

    static mapStats(response: any): NotificationStats {
        return {
            total: response.data.total,
            unread: response.data.unread,
            read: response.data.read,
        };
    }

    static getUserIdFromAccessToken(accessToken: string): string {
        const payload = JSON.parse(
            Buffer.from(accessToken.split(".")[1], "base64url").toString(),
        ) as { sub?: string };

        if (!payload.sub) {
            throw new Error("Access token is missing sub claim for notification seeding");
        }

        return payload.sub;
    }

    static buildSeedPayload(userId: string, index: number) {
        return {
            userId,
            title: `Automation Seed ${index + 1}`,
            message: "Notification created for notifications CRUD automation",
            notificationType: "info",
            priority: "LOW",
        };
    }
}
