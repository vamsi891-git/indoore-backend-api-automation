import { expect } from "@playwright/test";
import { Notification, NotificationStats} from "../Mapper/notifications.mapper";
export class NotificationsValidator {
    // =====================================
    // ROOT RESPONSE
    // =====================================
    validateResponse(response: any) {
        expect(response.success).toBeTruthy();
        expect(response.data).toBeDefined();
    }
    // =====================================
    // NOTIFICATIONS ARRAY
    // =====================================
    validateNotifications(notifications: Notification[]) {
        expect(notifications.length).toBeGreaterThan(0);
    }

    validateCreateResponse(response: any) {
        expect(response.success).toBeTruthy();
        expect(response.data?.id).toBeTruthy();
    }

    validateNoDataScenario(
        notifications: Notification[],
        stats: NotificationStats,
        total: number,
    ) {
        expect(total).toBe(0);
        expect(notifications.length).toBe(0);
        expect(stats.total).toBe(0);
        expect(stats.unread).toBe(0);
        expect(stats.read).toBe(0);
    }
    // =====================================
    // NOTIFICATION STRUCTURE
    // =====================================
    validateNotificationStructure(notifications: Notification[]) {
        for (const notification of notifications) {
            expect(notification.id).toBeTruthy();
            expect(notification.title).toBeTruthy();
            expect(notification.message).toBeTruthy();
            expect(notification.notificationType).toBeTruthy();
            expect(notification.priority).toBeTruthy();
            expect(notification.createdAt).toBeTruthy();
            expect(notification.updatedAt).toBeTruthy();
            expect(typeof notification.id).toBe("string");
            expect(typeof notification.title).toBe("string");
            expect(typeof notification.message).toBe("string");
            expect(typeof notification.notificationType).toBe("string");
            expect(typeof notification.priority).toBe("string");
            expect(typeof notification.isRead).toBe("boolean");
        }
    }
    // =====================================
    // DUPLICATE NOTIFICATIONS
    // =====================================
    validateDuplicateNotifications(notifications: Notification[]) {
        const ids = notifications.map(notification => notification.id);
        expect(new Set(ids).size).toBe(ids.length);
    }
    // =====================================
    // UUID VALIDATION
    // =====================================
    validateNotificationIds(notifications: Notification[]) {
        for (const notification of notifications) {
            expect(notification.id).toMatch(/^[0-9a-fA-F-]{36}$/);
        }
    }
    // =====================================
    // NOTIFICATION TYPES
    // =====================================
    validateNotificationTypes(notifications: Notification[]) {
        const validTypes = [
            "outage",
            "general",
            "disconnection",
            "alert",
            "warning",
            "info",
            "success"
        ];
        for (const notification of notifications) {
            expect(validTypes).toContain(notification.notificationType);
        }
    }
    // =====================================
    // PRIORITIES
    // =====================================
    validateNotificationPriorities(notifications: Notification[]) {
        const validPriorities = [
            "LOW",
            "MEDIUM",
            "HIGH",
            "URGENT"
        ];
        for (const notification of notifications) {
            expect(validPriorities).toContain(notification.priority);
        }
    }
    // =====================================
    // READ LOGIC
    // =====================================
    validateReadNotifications(notifications: Notification[]) {
        for (const notification of notifications) {
            if (notification.isRead) {
                expect(notification.readAt).not.toBeNull();
            }
        }
    }
    // =====================================
    // DOMAIN EVENTS
    // =====================================
    validateDomainEvents(notifications: Notification[]) {
        const validEvents = [
            "user.created",
            "user.invited",
            "user.updated",
            "user.status_changed",
            "user.deleted",
            "meter.connected",
            "meter.disconnected",
            "meter.command_failed",
            "meter.replaced",
            "meter.voltage_fluctuation",
            "meter.high_consumption",
            "meter.tamper_detected",
            "meter.comm_failure"
        ];
        for (const notification of notifications) {
            if (notification.meta && notification.meta.domainEvent ) {
                expect(validEvents).toContain(notification.meta.domainEvent);
            }
        }
    }
    // =====================================
    // SORTING VALIDATION
    // =====================================
    validateNotificationSorting(notifications: Notification[]) {
        for ( let i = 1; i < notifications.length; i++) {
            const previousDate =new Date(notifications[i - 1].createdAt).getTime();
            const currentDate =new Date(notifications[i].createdAt).getTime();
            expect(previousDate).toBeGreaterThanOrEqual(currentDate);
        }
    }
    // =====================================
    // NULL VALIDATION
    // =====================================
    validateNullValues(notifications: Notification[]) {
        for (const notification of notifications) {
            expect(notification.id).not.toBeNull();
            expect(notification.title).not.toBeNull();
            expect(notification.message).not.toBeNull();
            expect(notification.notificationType).not.toBeNull();
            expect(notification.priority).not.toBeNull();
            expect(notification.createdAt).not.toBeNull();
            expect(notification.updatedAt).not.toBeNull();
        }
    }
    // =====================================
    // NaN VALIDATION
    // ====================================
    validateNaNValues(notifications: Notification[]) {
        for (const notification of notifications) {
            expect(Number.isNaN(Number(notification.id))).toBeTruthy();
        }
    }
    // =====================================
    // STATS RESPONSE
    // =====================================
    validateStats(stats: NotificationStats) {
        expect(stats.total).toBeGreaterThanOrEqual(0);
        expect(stats.unread).toBeGreaterThanOrEqual(0);
        expect(stats.read).toBeGreaterThanOrEqual(0);
    }
    // =====================================
    // STATS BUSINESS RULE
    // =====================================
    validateStatsCalculation(stats: NotificationStats) {
        expect(stats.read).toBe(stats.total - stats.unread);
    }
    validateStatsAfterMarkRead(before: NotificationStats,after: NotificationStats,wasUnread: boolean,) {
        this.validateStatsCalculation(after);
        expect(after.total).toBe(before.total);
        if (wasUnread) {
            expect(after.unread).toBe(before.unread - 1);
            expect(after.read).toBe(before.read + 1);
        } else {
            expect(after.unread).toBe(before.unread);
            expect(after.read).toBe(before.read);
        }
    }
    validateNotificationMarkedRead(notifications: Notification[],notificationId: string,) {
        const notification = notifications.find((item) => item.id === notificationId,);
        expect(notification).toBeDefined();
        expect(notification!.isRead).toBeTruthy();
        expect(notification!.readAt).not.toBeNull();
    }
    validateAllNotificationsMarkedReadList(notifications: Notification[],) {
        for (const notification of notifications) {
            expect(notification.isRead).toBeTruthy();
            expect(notification.readAt).not.toBeNull();
        }
    }
    validateStatsAfterDelete(before: NotificationStats,after: NotificationStats,) {
        this.validateStatsCalculation(after);
        expect(after.total).toBe(before.total - 1);
        expect(after.read).toBe(before.read - 1);
        expect(after.unread).toBe(before.unread);
    }
    // =====================================
    // MARK READ RESPONSE
    // =====================================
    validateMarkReadResponse(response: any) {
        expect(response.success).toBeTruthy();
        expect(response.message).toBe("Notification marked as read.");
    }
    // =====================================
    // MARK ALL READ RESPONSE
    // =====================================
    validateMarkAllReadResponse(response: any) {
        expect(response.success).toBeTruthy();
        expect(response.data.count).toBeGreaterThanOrEqual(0);
    }
    // =====================================
    // ALL READ BUSINESS RULE
    // =====================================
    validateAllNotificationsRead(stats: NotificationStats) {
        expect(stats.unread).toBe(0);
        expect(stats.read).toBe(stats.total);
    }
    // =====================================
    // DELETE RESPONSE
    // =====================================
    validateDeleteResponse(response: any) {
        expect(response.success).toBeTruthy();
        expect(response.message).toBe("Notification deleted successfully.");
    }
    // =====================================
    // VERIFY DELETED
    // =====================================
    validateDeletedNotification(notifications: Notification[],deletedNotificationId: string) {
        const exists =notifications.some(notification =>notification.id ===deletedNotificationId);
        expect(exists).toBeFalsy();
    }
}