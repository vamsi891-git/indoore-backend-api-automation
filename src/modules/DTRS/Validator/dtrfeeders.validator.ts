import { expect } from "@playwright/test";
export class DtrFeedersValidator {
    // =====================================
    // FIELD VALIDATIONS
    // =====================================
    validateFields(data: any): void {
        expect(data).toHaveProperty("feeders");
        expect(Array.isArray(data.feeders)).toBeTruthy();
    }
    // =====================================
    // FEEDER STRUCTURE
    // =====================================
    validateFeederStructure(feeders: any[]): void {
        feeders.forEach(feeder => {
            expect(feeder).toHaveProperty("id");
            expect(feeder).toHaveProperty("status");
            expect(feeder).toHaveProperty("lastCommunication");
            expect(typeof feeder.id).toBe("string");
            expect(typeof feeder.status).toBe("string");
            expect(feeder.lastCommunication === null ||typeof feeder.lastCommunication === "string").toBeTruthy();
        });
    }
    // =====================================
    // STATUS VALIDATION
    // =====================================
    validateStatuses(feeders: any[],allowedStatuses: string[]): void {
        feeders.forEach(feeder => {
            expect(allowedStatuses.includes(feeder.status)).toBeTruthy();
        });
    }
    // =====================================
    // FEEDER ID VALIDATION
    // =====================================
    validateFeederIds(feeders: any[]): void {
        feeders.forEach(feeder => {
            expect(feeder.id.trim().length).toBeGreaterThan(0);
            expect(feeder.id.includes(" ")).toBeFalsy();
        });
    }
    // =====================================
    // LAST COMMUNICATION
    // =====================================
    validateLastCommunication(feeders: any[]): void {
        feeders.forEach(feeder => {
            if (feeder.lastCommunication !== null) {
                expect(isNaN(Date.parse(feeder.lastCommunication))).toBeFalsy();
            }
        });
    }
    // =====================================
    // NULL LAST COMMUNICATION
    // =====================================
    validateNullLastCommunication(feeders: any[]): void {
        feeders.forEach(feeder => {
            expect(feeder.lastCommunication).toBeNull();
        });
    }
    // =====================================
    // UNIQUE IDS
    // =====================================
    validateUniqueIds(feeders: any[]): void {
        const ids =feeders.map(x => x.id);
        const unique =new Set(ids);
        expect(unique.size).toBe(ids.length);
    }
    // =====================================
    // EMPTY ARRAY VALIDATION
    // =====================================
    validateEmptyArray(feeders: any[]): void {
        expect(Array.isArray(feeders)).toBeTruthy();
    }
    // =====================================
    // RESPONSE SUCCESS
    // =====================================
    validateSuccess(response: any): void {
        expect(response.success).toBeTruthy();
    }
    // =====================================
    // FEEDER ORDER VALIDATION
    // =====================================
    validateFeederOrder(feeders: any[]): void {
        if (feeders.length <= 1) {
            return;
        }
        for (let i = 1;i < feeders.length;i++) {
            expect(feeders[i].id.localeCompare(feeders[i - 1].id)
            ).toBeGreaterThanOrEqual(0);
        }
    }
    // =====================================
    // NO EMPTY STATUS
    // =====================================
    validateEmptyStatus(feeders: any[]): void {
        feeders.forEach(feeder => {
            expect(feeder.status.trim().length).toBeGreaterThan(0);
        });
    }
    // =====================================
    // RESPONSE DATA TYPE
    // =====================================
    validateResponseDataType(feeders: any[]): void {
        feeders.forEach(feeder => {
            expect(typeof feeder).toBe("object");
        });
    }
}