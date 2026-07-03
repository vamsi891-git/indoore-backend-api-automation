import { expect } from "@playwright/test";
import { dtrFeedersData } from "../Data/dtrfeeders.data";

type FeederItem = {
    id: string;
    status: string;
    lastCommunication: string | null;
};

export class DtrFeedersValidator {
    // =====================================
    // RESPONSE ENVELOPE
    // =====================================
    validateResponseEnvelope(response: { success: boolean; data: unknown }): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
    }

    // =====================================
    // TOP-LEVEL FIELDS
    // =====================================
    validateFields(data: { feeders: FeederItem[] }): void {
        expect(data).toHaveProperty("feeders");
        expect(Array.isArray(data.feeders)).toBeTruthy();
    }

    // =====================================
    // FEEDER STRUCTURE — id, status, lastCommunication only
    // =====================================
    validateFeederStructure(feeders: FeederItem[]): void {
        feeders.forEach((feeder) => {
            expect(Object.keys(feeder).sort()).toEqual(
                [...dtrFeedersData.feederFields].sort(),
            );
            expect(typeof feeder.id).toBe("string");
            expect(typeof feeder.status).toBe("string");
            expect(
                feeder.lastCommunication === null ||
                    typeof feeder.lastCommunication === "string",
            ).toBeTruthy();
        });
    }

    // =====================================
    // STATUS — IsActiveStatus → Active | Inactive
    // =====================================
    validateStatuses(
        feeders: FeederItem[],
        allowedStatuses: readonly string[],
    ): void {
        feeders.forEach((feeder) => {
            expect([...allowedStatuses]).toContain(feeder.status);
        });
    }

    // =====================================
    // FEEDER ID — Network_Code trim or NetworkLookup_TblRefID string
    // =====================================
    validateFeederIds(feeders: FeederItem[]): void {
        feeders.forEach((feeder) => {
            expect(feeder.id.trim().length).toBeGreaterThan(0);
        });
    }

    // =====================================
    // LAST COMMUNICATION — always null on DTR feeders route
    // =====================================
    validateLastCommunicationAlwaysNull(feeders: FeederItem[]): void {
        feeders.forEach((feeder) => {
            expect(feeder.lastCommunication).toBeNull();
        });
    }

    // =====================================
    // UNIQUE IDS
    // =====================================
    validateUniqueIds(feeders: FeederItem[]): void {
        const ids = feeders.map((x) => x.id);
        expect(new Set(ids).size).toBe(ids.length);
    }

    // =====================================
    // FEEDER ORDER — depth ASC, then Network_Code ASC (id proxy)
    // =====================================
    validateFeederOrder(feeders: FeederItem[]): void {
        if (feeders.length <= 1) {
            return;
        }
        for (let i = 1; i < feeders.length; i++) {
            expect(feeders[i].id.localeCompare(feeders[i - 1].id)).toBeGreaterThanOrEqual(0);
        }
    }

    // =====================================
    // NON-EMPTY STATUS
    // =====================================
    validateEmptyStatus(feeders: FeederItem[]): void {
        feeders.forEach((feeder) => {
            expect(feeder.status.trim().length).toBeGreaterThan(0);
        });
    }

    // =====================================
    // EMPTY FEEDERS ARRAY — valid when no feeder ancestors
    // =====================================
    validateFeedersArray(feeders: FeederItem[]): void {
        expect(Array.isArray(feeders)).toBeTruthy();
    }
}
