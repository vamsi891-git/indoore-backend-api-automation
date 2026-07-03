import { expect } from "@playwright/test";
import { dtrProfileData } from "../Data/dtrprofile.data";

type ProfileItem = {
    title: string;
    value: string | null;
};

type ActivityItem = {
    title: string;
    timestamp: string;
};

type ProfileData = {
    profileInformation: ProfileItem[];
    hierarchy: ProfileItem[];
    latestActivities: ActivityItem[];
};

export class DtrProfileValidator {
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
    validateFields(data: ProfileData): void {
        expect(data).toHaveProperty("profileInformation");
        expect(data).toHaveProperty("hierarchy");
        expect(data).toHaveProperty("latestActivities");
        expect(Array.isArray(data.profileInformation)).toBeTruthy();
        expect(Array.isArray(data.hierarchy)).toBeTruthy();
        expect(Array.isArray(data.latestActivities)).toBeTruthy();
    }

    // =====================================
    // PROFILE COUNT — fixed 13 fields from getDtrProfileByCode
    // =====================================
    validateProfileFieldCount(profileInformation: ProfileItem[]): void {
        expect(profileInformation.length).toBe(dtrProfileData.profileFieldCount);
    }

    // =====================================
    // PROFILE TITLE ORDER
    // =====================================
    validateProfileTitles(
        profileInformation: ProfileItem[],
        expectedTitles: readonly string[],
    ): void {
        const actualTitles = profileInformation.map((x) => x.title);
        expect(actualTitles).toEqual([...expectedTitles]);
    }

    // =====================================
    // PROFILE STRUCTURE — value is string | null
    // =====================================
    validateProfileStructure(profileInformation: ProfileItem[]): void {
        profileInformation.forEach((item) => {
            expect(item).toHaveProperty("title");
            expect(item).toHaveProperty("value");
            expect(typeof item.title).toBe("string");
            expect(item.value === null || typeof item.value === "string").toBeTruthy();
        });
    }

    // =====================================
    // HIERARCHY STRUCTURE — value always string (Network_Name trim)
    // =====================================
    validateHierarchyStructure(hierarchy: ProfileItem[]): void {
        hierarchy.forEach((item) => {
            expect(item).toHaveProperty("title");
            expect(item).toHaveProperty("value");
            expect(typeof item.title).toBe("string");
            expect(typeof item.value).toBe("string");
            expect(item.title.length).toBeGreaterThan(0);
        });
    }

    // =====================================
    // HIERARCHY ORDER — depth DESC: root → … → DTR last
    // =====================================
    validateHierarchyOrder(hierarchy: ProfileItem[]): void {
        expect(hierarchy.length).toBeGreaterThan(0);
        const lastHierarchy = hierarchy[hierarchy.length - 1];
        expect(lastHierarchy.title).toBe("DTR");
        expect(lastHierarchy.value).not.toBeNull();
        expect(lastHierarchy.value!.length).toBeGreaterThan(0);
    }

    // =====================================
    // ACTIVITIES STRUCTURE — fetchLatestActivities LIMIT 5
    // =====================================
    validateActivitiesStructure(latestActivities: ActivityItem[]): void {
        latestActivities.forEach((activity) => {
            expect(activity).toHaveProperty("title");
            expect(activity).toHaveProperty("timestamp");
            expect(typeof activity.title).toBe("string");
            expect(typeof activity.timestamp).toBe("string");
            expect(activity.title.length).toBeGreaterThan(0);
            expect(activity.timestamp.length).toBeGreaterThan(0);
        });
    }

    // =====================================
    // ACTIVITIES LIMIT — max 5, empty array allowed
    // =====================================
    validateActivitiesLimit(latestActivities: ActivityItem[]): void {
        expect(latestActivities.length).toBeLessThanOrEqual(dtrProfileData.maxActivities);
    }

    // =====================================
    // ACTIVITY TITLE — empty eventName → "Meter event"
    // =====================================
    validateActivityTitles(latestActivities: ActivityItem[]): void {
        latestActivities.forEach((activity) => {
            expect(activity.title).not.toBe("");
            if (activity.title === dtrProfileData.defaultActivityTitle) {
                expect(activity.title).toBe("Meter event");
            }
        });
    }

    // =====================================
    // LATITUDE / LONGITUDE — numeric strings when present
    // =====================================
    validateCoordinates(profileInformation: ProfileItem[]): void {
        const latitude = profileInformation.find((x) => x.title === "Latitude");
        const longitude = profileInformation.find((x) => x.title === "Longitude");

        if (latitude != null && latitude.value !== null) {
            const lat = Number(latitude.value);
            expect(Number.isFinite(lat)).toBeTruthy();
            expect(lat).toBeGreaterThanOrEqual(-90);
            expect(lat).toBeLessThanOrEqual(90);
        }

        if (longitude != null && longitude.value !== null) {
            const lon = Number(longitude.value);
            expect(Number.isFinite(lon)).toBeTruthy();
            expect(lon).toBeGreaterThanOrEqual(-180);
            expect(lon).toBeLessThanOrEqual(180);
        }
    }

    // =====================================
    // CAPACITY — "{n} kVA" or null (getDtrRatedCapacityKva)
    // =====================================
    validateCapacityFormat(profileInformation: ProfileItem[]): void {
        const capacity = profileInformation.find((x) => x.title === "Capacity");
        expect(capacity).toBeDefined();
        if (capacity!.value !== null) {
            expect(capacity!.value).toMatch(/^\d+(\.\d+)? kVA$/);
        }
    }

    // =====================================
    // NON-NULL VALUES — no empty strings
    // =====================================
    validateEmptyStrings(profileInformation: ProfileItem[]): void {
        profileInformation.forEach((item) => {
            if (item.value !== null) {
                expect(item.value.trim().length).toBeGreaterThan(0);
            }
        });
    }

    // =====================================
    // UNIQUE PROFILE TITLES
    // =====================================
    validateUniqueTitles(profileInformation: ProfileItem[]): void {
        const titles = profileInformation.map((x) => x.title);
        expect(new Set(titles).size).toBe(titles.length);
    }

    // =====================================
    // DTR NO — matches requested Network_Code
    // =====================================
    validateDtrNumber(profileInformation: ProfileItem[], expectedDtrCode: string): void {
        const dtrNo = profileInformation.find((x) => x.title === "DTR No");
        expect(dtrNo?.value).toBe(expectedDtrCode);
    }

    // =====================================
    // DTR NAME — non-null string when DTR exists
    // =====================================
    validateDtrName(profileInformation: ProfileItem[]): void {
        const dtrName = profileInformation.find((x) => x.title === "DTR Name");
        expect(dtrName?.value).not.toBeNull();
        expect(typeof dtrName?.value).toBe("string");
    }

    // =====================================
    // MF — numeric string when present
    // =====================================
    validateMF(profileInformation: ProfileItem[]): void {
        const mf = profileInformation.find((x) => x.title === "MF");
        if (mf != null && mf.value !== null) {
            expect(Number.isFinite(Number(mf.value))).toBeTruthy();
            expect(Number(mf.value)).toBeGreaterThan(0);
        }
    }

    // =====================================
    // METER SL NO — numeric string when present
    // =====================================
    validateMeterSerial(profileInformation: ProfileItem[]): void {
        const meterSl = profileInformation.find((x) => x.title === "Meter SL No");
        if (meterSl != null && meterSl.value !== null) {
            expect(/^\d+$/.test(meterSl.value)).toBeTruthy();
        }
    }

    // =====================================
    // UNIQUE HIERARCHY TITLES
    // =====================================
    validateUniqueHierarchy(hierarchy: ProfileItem[]): void {
        const titles = hierarchy.map((x) => x.title);
        expect(new Set(titles).size).toBe(titles.length);
    }

    // =====================================
    // HIERARCHY ↔ PROFILE CONSISTENCY
    // Sub Station / Feeder values align when both present
    // =====================================
    validateHierarchyProfileConsistency(
        profileInformation: ProfileItem[],
        hierarchy: ProfileItem[],
    ): void {
        const profileFeeder = profileInformation.find((x) => x.title === "Feeder")?.value;
        const hierarchyFeeder = hierarchy.find((x) => x.title === "Feeder")?.value;

        if (profileFeeder && hierarchyFeeder) {
            expect(hierarchyFeeder).toBe(profileFeeder);
        }

        const profileSubStation = profileInformation.find((x) => x.title === "Sub Station")?.value;
        const hierarchySubStation = hierarchy.find((x) => x.title === "Sub Station")?.value;

        if (profileSubStation && hierarchySubStation) {
            expect(hierarchySubStation).toBe(profileSubStation);
        }
    }
}
