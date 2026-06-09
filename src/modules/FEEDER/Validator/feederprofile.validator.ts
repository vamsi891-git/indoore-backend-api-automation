import { expect } from "@playwright/test";
import { FeederProfileData, FeederProfileResponse, OverviewItem} from "../Mapper/feederprofile.mapper";
export class FeederProfileValidator {
    validateSuccess(response: FeederProfileResponse): void {
        expect(response.success).toBe(true);
    }

    validateResponseData(response: FeederProfileResponse): void {
        expect(response.data).toBeDefined();
        expect(response.data).not.toBeNull();
    }

    validateFields(data: FeederProfileData): void {
        expect(data).toHaveProperty("feederCode");
        expect(data).toHaveProperty("feederName");
        expect(data).toHaveProperty("status");
        expect(data).toHaveProperty("parentDtr");
        expect(data).toHaveProperty("overview");
    }

    validateFeederCode(data: FeederProfileData, expectedFeederCode: string): void {
        expect(data.feederCode).toBe(expectedFeederCode);
    }

    validateOverviewCount(overview: OverviewItem[]): void {
        expect(overview.length).toBe(4);
    }

    validateOverviewStructure(overview: OverviewItem[]): void {
        overview.forEach(item => {
            expect(item).toHaveProperty("title");
            expect(item).toHaveProperty("value");
            expect(item.title).toBeTruthy();
        });
    }

    validateOverviewOrder(overview: OverviewItem[], expectedTitles: string[]): void {
        const titles = overview.map(item => item.title);
        expect(titles).toEqual(expectedTitles);
    }

    validateTypes(data: FeederProfileData): void {
        expect(typeof data.feederCode).toBe("string");

        if (data.feederName !== null) {
            expect(typeof data.feederName).toBe("string");
        }

        expect(typeof data.status).toBe("string");
        expect(Array.isArray(data.overview)).toBeTruthy();
    }

    validateStatus(data: FeederProfileData): void {
        expect(["Active", "Inactive"].includes(data.status)).toBeTruthy();
    }

    validateParentDtr(data: FeederProfileData): void {
        if (data.parentDtr !== null) {
            expect(data.parentDtr).toHaveProperty("dtrCode");
            expect(data.parentDtr).toHaveProperty("dtrName");
            expect(typeof data.parentDtr.dtrCode).toBe("string");
        }
    }

    validateFeederStatusLogic(data: FeederProfileData): void {
        const feederStatus = data.overview.find(item => item.title === "Feeder Status");

        if (data.status === "Active") {
            expect(feederStatus?.value).toBe("ACTIVE");
        }

        if (data.status === "Inactive") {
            expect(feederStatus?.value).toBe("INACTIVE");
        }
    }

    validateDtrNumberLogic(data: FeederProfileData): void {
        const dtrNumber = data.overview.find(item => item.title === "DTR Number");

        if (data.parentDtr) {
            expect(dtrNumber?.value).toBe(data.parentDtr.dtrCode);
        }
    }

    validateCapacityLogic(data: FeederProfileData): void {
        const dtrCapacity = data.overview.find(item => item.title === "DTR Capacity");
        const feederCapacity = data.overview.find(item => item.title === "Feeder Capacity");

        if (dtrCapacity && dtrCapacity.value !== null) {
            expect(String(dtrCapacity.value).includes("kVA")).toBeTruthy();
        }

        if (feederCapacity && feederCapacity.value !== null) {
            expect(String(feederCapacity.value).includes("kVA")).toBeTruthy();
        }
    }

    validateUniqueTitles(overview: OverviewItem[]): void {
        const titles = overview.map(item => item.title);
        const unique = new Set(titles);
        expect(unique.size).toBe(titles.length);
    }

    validateNaN(data: FeederProfileData): void {
        expect(data.feederCode).toBeTruthy();

        data.overview.forEach(item => {
            if (typeof item.value === "number") {
                expect(Number.isNaN(item.value)).toBeFalsy();
            }
        });
    }
}
