import { expect } from "@playwright/test";
export class DtrProfileValidator {
    // =====================================
    // FIELD VALIDATIONS
    // =====================================
    validateFields(data: any): void {
        expect(data).toHaveProperty("profileInformation");
        expect(data).toHaveProperty("hierarchy");
        expect(data).toHaveProperty("latestActivities");
        expect(Array.isArray(data.profileInformation)).toBeTruthy();
        expect(Array.isArray(data.hierarchy)).toBeTruthy();
        expect(Array.isArray(data.latestActivities)).toBeTruthy();
    }
    // =====================================
    // PROFILE TITLE VALIDATION
    // =====================================
    validateProfileTitles(profileInformation: any[],expectedTitles: string[]): void {
        const actualTitles =profileInformation.map( x => x.title);
        expect(actualTitles).toEqual(expectedTitles);
    }
    // =====================================
    // HIERARCHY VALIDATION
    // =====================================
    validateHierarchyTitles(hierarchy: any[],expectedTitles: string[]): void {
        const actualTitles =hierarchy.map( x => x.title);
        expect(actualTitles).toEqual(expectedTitles);
    }
    // =====================================
    // PROFILE STRUCTURE
    // =====================================
    validateProfileStructure(profileInformation: any[]): void {
        profileInformation.forEach(item => {
            expect(item).toHaveProperty("title");
            expect(item).toHaveProperty("value");
            expect(typeof item.title).toBe("string");
            expect(item.value === null || typeof item.value === "string").toBeTruthy();
        });
    }
    // =====================================
    // HIERARCHY STRUCTURE
    // =====================================
    validateHierarchyStructure(hierarchy: any[]): void {
        hierarchy.forEach(item => {
            expect(item).toHaveProperty("title");
            expect(item).toHaveProperty("value");
        });
    }
    // =====================================
    // ACTIVITIES STRUCTURE
    // =====================================
    validateActivitiesStructure(latestActivities: any[]): void {
        latestActivities.forEach(activity => {
            expect(activity).toHaveProperty("title");
            expect(activity).toHaveProperty("timestamp");
            expect(typeof activity.title).toBe("string");
            expect(typeof activity.timestamp).toBe("string");
        });
    }
    // =====================================
    // ACTIVITIES LIMIT
    // =====================================
    validateActivitiesLimit(latestActivities: any[] ): void {
        expect(latestActivities.length).toBeLessThanOrEqual(5);
    }
    // =====================================
    // LATITUDE LONGITUDE
    // =====================================
    validateCoordinates(profileInformation: any[]): void {
        const latitude =profileInformation.find(x => x.title === "Latitude");
        const longitude =profileInformation.find(x => x.title === "Longitude");
        if (latitude?.value !== null) {
            expect(isNaN(Number(latitude.value))).toBeFalsy();
        }
        if (longitude?.value !== null) {
            expect(isNaN(Number(longitude.value))).toBeFalsy();
        }
    }
    // =====================================
    // CAPACITY FORMAT
    // =====================================
    validateCapacityFormat(profileInformation: any[]): void {
        const capacity =profileInformation.find(x => x.title === "Capacity");
        if (capacity?.value !== null) {
            expect(capacity.value.endsWith(" kVA")).toBeTruthy();
        }
    }
    // =====================================
    // EMPTY STRING VALIDATION
    // =====================================
    validateEmptyStrings(
        profileInformation: any[]
    ): void {
        profileInformation.forEach(item => {
            if (item.value !== null) {
                expect(item.value.trim().length).toBeGreaterThan(0);
            }
        });
    }
    // =====================================
    // UNIQUE PROFILE TITLES
    // =====================================
    validateUniqueTitles(profileInformation: any[]): void {
        const titles =profileInformation.map(x => x.title);
        const unique =new Set(titles);
        expect(unique.size).toBe(titles.length);
    }
    // =====================================
    // DTR NUMBER VALIDATION
    // =====================================
    validateDtrNumber(
profileInformation: any[],expectedDtrCode: string): void {
        const dtrNo =profileInformation.find(x => x.title === "DTR No");
        expect(dtrNo?.value).toBe(expectedDtrCode);
    }
//=====================================
    // HIERARCHY ORDER
    // =====================================
    validateHierarchyOrder(hierarchy: any[]): void {
        expect(hierarchy.length).toBeGreaterThan(0);
        const lastHierarchy =hierarchy[hierarchy.length - 1];
        expect(lastHierarchy.title).toBe("DTR");
    }
//=====================================
    // =====================================
    // MF VALIDATION
    // =====================================

    validateMF(profileInformation: any[]): void {
        const mf =profileInformation.find(x => x.title === "MF");
        if ( mf?.value !== null ) {
            expect(isNaN(Number(mf.value))).toBeFalsy();
        }
    }
    // =====================================
    // NO DUPLICATE HIERARCHY
    // =====================================
    validateUniqueHierarchy(hierarchy: any[]): void {
        const titles =hierarchy.map(x => x.title);
        const unique = new Set(titles);
        expect(unique.size ).toBe(titles.length);
    }
}