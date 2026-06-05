import { expect } from "@playwright/test";
import {
    MobileNotificationSendData,
    MobileNotificationSendResponse,
} from "../Mapper/notificationsmobile.mapper";
import { NotificationsMobileData } from "../Data/notificationsmobile.data";

export class NotificationsMobileValidator {
    validateSuccess(response: MobileNotificationSendResponse) {
        expect(response.success).toBeTruthy();
    }

    validateMessage(response: MobileNotificationSendResponse) {
        expect(response.message).toBe(NotificationsMobileData.expectedMessage);
    }

    validateStructure(response: MobileNotificationSendResponse) {
        expect(response.data).toBeDefined();
        expect(typeof response.data.consumerCid).toBe("string");
        expect(typeof response.data.notificationType).toBe("string");
        expect(typeof response.data.totalRecipients).toBe("number");
        expect(typeof response.data.delivered).toBe("number");
        expect(typeof response.data.skipped).toBe("number");
        expect(Array.isArray(response.data.invalidMobiles)).toBeTruthy();
        expect(typeof response.data.dispatchStatus).toBe("string");
        expect(typeof response.data.dispatchMode).toBe("string");
        expect(typeof response.data.failedBatches).toBe("number");
    }

    validateRequestEcho(
        data: MobileNotificationSendData,
        consumerCid: string,
        notificationType: string,
    ) {
        expect(data.consumerCid).toBe(consumerCid);
        expect(data.notificationType).toBe(notificationType);
    }

    validateNotificationType(data: MobileNotificationSendData) {
        expect(NotificationsMobileData.validNotificationTypes).toContain(
            data.notificationType,
        );
    }

    validateRecipientCounts(data: MobileNotificationSendData) {
        expect(data.totalRecipients).toBeGreaterThanOrEqual(0);
        expect(data.delivered).toBeGreaterThanOrEqual(0);
        expect(data.skipped).toBeGreaterThanOrEqual(0);
        expect(data.delivered + data.skipped).toBeLessThanOrEqual(
            data.totalRecipients,
        );
    }

    validateInvalidMobiles(data: MobileNotificationSendData) {
        for (const mobile of data.invalidMobiles) {
            expect(typeof mobile).toBe("string");
        }
    }

    validateDispatchStatus(data: MobileNotificationSendData) {
        expect(data.dispatchStatus).toBe("completed");
    }

    validateDispatchMode(data: MobileNotificationSendData) {
        expect(data.dispatchMode).toBe("single");
    }

    validateFailedBatches(data: MobileNotificationSendData) {
        expect(data.failedBatches).toBeGreaterThanOrEqual(0);
    }
}
