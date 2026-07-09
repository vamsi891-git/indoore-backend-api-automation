import { expect } from "@playwright/test";
import {
  dtrProfileDefaultActivityTitle,
  dtrProfileExpectedTitles,
  dtrProfileFieldCount,
  dtrProfileMaxActivities,
} from "../Data/dtrprofile.data";
import type {
  ActivityItem,
  DtrProfileErrorResponse,
  DtrProfileResponse,
  DtrProfileScenario,
  MappedDtrProfile,
  ProfileItem,
} from "../Mapper/dtrprofile.mapper";

const IST_DATE_TIME =
  /^\d{1,2}[\s/-](?:\w{3}|\d{2})[\s/-]\d{4}.+\d{1,2}:\d{2}|^\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}/i;

function findProfileItem(
  items: ProfileItem[],
  title: string,
): ProfileItem | undefined {
  return items.find((x) => x.title === title);
}

export class DtrProfileValidator {
  validateSuccess(success: boolean): void {
    expect(success).toBeTruthy();
  }

  validateNotFoundError(responseBody: DtrProfileErrorResponse): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("DTR_NOT_FOUND");
    expect(responseBody.error.message.toLowerCase()).toContain("dtr not found");
  }

  validateBlankCodeError(responseBody: DtrProfileErrorResponse): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toMatch(
      /dtr|network|code/i,
    );
  }

  validateResponseEnvelope(response: DtrProfileResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateFields(data: MappedDtrProfile): void {
    expect(data).toHaveProperty("profileInformation");
    expect(data).toHaveProperty("hierarchy");
    expect(data).toHaveProperty("latestActivities");
    expect(Array.isArray(data.profileInformation)).toBeTruthy();
    expect(Array.isArray(data.hierarchy)).toBeTruthy();
    expect(Array.isArray(data.latestActivities)).toBeTruthy();
  }

  validateProfileFieldCount(profileInformation: ProfileItem[]): void {
    expect(profileInformation.length).toBe(dtrProfileFieldCount);
  }

  validateProfileTitles(profileInformation: ProfileItem[]): void {
    const actualTitles = profileInformation.map((x) => x.title);
    expect(actualTitles).toEqual([...dtrProfileExpectedTitles]);
  }

  validateProfileStructure(profileInformation: ProfileItem[]): void {
    profileInformation.forEach((item) => {
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("value");
      expect(typeof item.title).toBe("string");
      expect(item.value === null || typeof item.value === "string").toBeTruthy();
    });
  }

  validateHierarchyStructure(hierarchy: ProfileItem[]): void {
    hierarchy.forEach((item) => {
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("value");
      expect(typeof item.title).toBe("string");
      expect(typeof item.value).toBe("string");
      expect(item.title.length).toBeGreaterThan(0);
    });
  }

  validateHierarchyOrder(hierarchy: ProfileItem[]): void {
    expect(hierarchy.length).toBeGreaterThan(0);
    const lastHierarchy = hierarchy[hierarchy.length - 1];
    expect(lastHierarchy.title).toBe("DTR");
    expect(lastHierarchy.value).not.toBeNull();
    expect(lastHierarchy.value!.length).toBeGreaterThan(0);
  }

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

  validateActivitiesLimit(latestActivities: ActivityItem[]): void {
    expect(latestActivities.length).toBeLessThanOrEqual(dtrProfileMaxActivities);
  }

  validateActivityTitles(latestActivities: ActivityItem[]): void {
    latestActivities.forEach((activity) => {
      expect(activity.title).not.toBe("");
    });
  }

  validateActivityTimestamps(latestActivities: ActivityItem[]): void {
    latestActivities.forEach((activity) => {
      expect(IST_DATE_TIME.test(activity.timestamp.trim())).toBeTruthy();
    });
  }

  validateCoordinates(profileInformation: ProfileItem[]): void {
    const latitude = findProfileItem(profileInformation, "Latitude");
    const longitude = findProfileItem(profileInformation, "Longitude");

    if (latitude?.value !== null && latitude?.value !== undefined) {
      const lat = Number(latitude.value);
      expect(Number.isFinite(lat)).toBeTruthy();
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
    }

    if (longitude?.value !== null && longitude?.value !== undefined) {
      const lon = Number(longitude.value);
      expect(Number.isFinite(lon)).toBeTruthy();
      expect(lon).toBeGreaterThanOrEqual(-180);
      expect(lon).toBeLessThanOrEqual(180);
    }
  }

  validateCapacityFormat(profileInformation: ProfileItem[]): void {
    const capacity = findProfileItem(profileInformation, "Capacity");
    expect(capacity).toBeDefined();
    if (capacity!.value !== null) {
      expect(capacity!.value).toMatch(/^\d+(\.\d+)? kVA$/);
    }
  }

  validateEmptyStrings(profileInformation: ProfileItem[]): void {
    profileInformation.forEach((item) => {
      if (item.value !== null) {
        expect(item.value.trim().length).toBeGreaterThan(0);
      }
    });
  }

  validateUniqueTitles(profileInformation: ProfileItem[]): void {
    const titles = profileInformation.map((x) => x.title);
    expect(new Set(titles).size).toBe(titles.length);
  }

  validateDtrNumber(
    profileInformation: ProfileItem[],
    expectedDtrCode: string,
  ): void {
    const dtrNo = findProfileItem(profileInformation, "DTR No");
    expect(dtrNo?.value).toBe(expectedDtrCode.trim());
  }

  validateDtrName(profileInformation: ProfileItem[]): void {
    const dtrName = findProfileItem(profileInformation, "DTR Name");
    expect(dtrName?.value).not.toBeNull();
    expect(typeof dtrName?.value).toBe("string");
  }

  validateMF(profileInformation: ProfileItem[]): void {
    const mf = findProfileItem(profileInformation, "MF");
    if (mf?.value !== null && mf?.value !== undefined) {
      expect(Number.isFinite(Number(mf.value))).toBeTruthy();
      expect(Number(mf.value)).toBeGreaterThan(0);
    }
  }

  validateMeterSerial(profileInformation: ProfileItem[]): void {
    const meterSl = findProfileItem(profileInformation, "Meter SL No");
    if (meterSl?.value !== null && meterSl?.value !== undefined) {
      expect(/^\d+$/.test(meterSl.value)).toBeTruthy();
    }
  }

  validateUniqueHierarchy(hierarchy: ProfileItem[]): void {
    const titles = hierarchy.map((x) => x.title);
    expect(new Set(titles).size).toBe(titles.length);
  }

  validateHierarchyProfileConsistency(
    profileInformation: ProfileItem[],
    hierarchy: ProfileItem[],
  ): void {
    const profileFeeder = findProfileItem(profileInformation, "Feeder")?.value;
    const hierarchyFeeder = hierarchy.find((x) => x.title === "Feeder")?.value;

    if (profileFeeder && hierarchyFeeder) {
      expect(hierarchyFeeder).toBe(profileFeeder);
    }

    const profileSubStation = findProfileItem(
      profileInformation,
      "Sub Station",
    )?.value;
    const hierarchySubStation = hierarchy.find(
      (x) => x.title === "Sub Station",
    )?.value;

    if (profileSubStation && hierarchySubStation) {
      expect(hierarchySubStation).toBe(profileSubStation);
    }
  }

  validateLiveOk(mapped: MappedDtrProfile, expectedDtrCode?: string): void {
    this.validateSuccess(mapped.success);
    this.validateFields(mapped);
    this.validateProfileFieldCount(mapped.profileInformation);
    this.validateProfileTitles(mapped.profileInformation);
    this.validateProfileStructure(mapped.profileInformation);
    this.validateDtrName(mapped.profileInformation);
    this.validateHierarchyStructure(mapped.hierarchy);
    this.validateHierarchyOrder(mapped.hierarchy);
    this.validateHierarchyProfileConsistency(
      mapped.profileInformation,
      mapped.hierarchy,
    );
    this.validateActivitiesStructure(mapped.latestActivities);
    this.validateActivitiesLimit(mapped.latestActivities);
    this.validateActivityTitles(mapped.latestActivities);
    this.validateCoordinates(mapped.profileInformation);
    this.validateCapacityFormat(mapped.profileInformation);
    this.validateMeterSerial(mapped.profileInformation);
    this.validateEmptyStrings(mapped.profileInformation);
    this.validateUniqueTitles(mapped.profileInformation);
    this.validateMF(mapped.profileInformation);
    this.validateUniqueHierarchy(mapped.hierarchy);

    if (expectedDtrCode) {
      this.validateDtrNumber(mapped.profileInformation, expectedDtrCode);
    }
  }

  validateLive11Iw3Contract(mapped: MappedDtrProfile): void {
    this.validateLiveOk(mapped);
    expect(findProfileItem(mapped.profileInformation, "DTR No")?.value).toBe(
      "11IW3",
    );
    expect(findProfileItem(mapped.profileInformation, "Capacity")?.value).toBeNull();
    expect(findProfileItem(mapped.profileInformation, "Latitude")?.value).toBeNull();
    expect(findProfileItem(mapped.profileInformation, "Longitude")?.value).toBeNull();
    expect(mapped.latestActivities).toEqual([]);
    expect(mapped.hierarchy[mapped.hierarchy.length - 1]).toEqual({
      title: "DTR",
      value: "11IW3",
    });
  }

  validateNullOptionalContract(mapped: MappedDtrProfile): void {
    this.validateLiveOk(mapped);
    expect(findProfileItem(mapped.profileInformation, "Capacity")?.value).toBeNull();
    expect(findProfileItem(mapped.profileInformation, "Latitude")?.value).toBeNull();
    expect(findProfileItem(mapped.profileInformation, "Longitude")?.value).toBeNull();
  }

  validateEmptyActivitiesContract(mapped: MappedDtrProfile): void {
    this.validateLiveOk(mapped);
    expect(mapped.latestActivities).toEqual([]);
  }

  validateWithActivitiesContract(mapped: MappedDtrProfile): void {
    this.validateLiveOk(mapped);
    expect(mapped.latestActivities.length).toBe(2);
    expect(mapped.latestActivities[0].title).toBe("Power failure");
    expect(mapped.latestActivities[1].title).toBe(
      dtrProfileDefaultActivityTitle,
    );
    this.validateActivityTimestamps(mapped.latestActivities);
  }

  validateCapacityKvaContract(mapped: MappedDtrProfile): void {
    this.validateLiveOk(mapped);
    expect(findProfileItem(mapped.profileInformation, "Capacity")?.value).toBe(
      "250 kVA",
    );
    expect(findProfileItem(mapped.profileInformation, "Latitude")?.value).toBe(
      "22.7196",
    );
    expect(findProfileItem(mapped.profileInformation, "Longitude")?.value).toBe(
      "75.8577",
    );
  }

  validateDeepHierarchyContract(mapped: MappedDtrProfile): void {
    this.validateLiveOk(mapped);
    const labels = mapped.hierarchy.map((x) => x.title);
    expect(labels).toEqual([
      "Circle",
      "Division",
      "Zone",
      "Sub Station",
      "Feeder",
      "DTR",
    ]);
    expect(labels[labels.length - 1]).toBe("DTR");
  }

  validateScenario(
    mapped: MappedDtrProfile,
    scenario: DtrProfileScenario,
    expectedDtrCode?: string,
  ): void {
    switch (scenario) {
      case "contract_live_11iw3":
        this.validateLive11Iw3Contract(mapped);
        break;
      case "contract_null_optional_fields":
        this.validateNullOptionalContract(mapped);
        break;
      case "contract_empty_activities":
        this.validateEmptyActivitiesContract(mapped);
        break;
      case "contract_with_activities":
        this.validateWithActivitiesContract(mapped);
        break;
      case "contract_capacity_kva":
        this.validateCapacityKvaContract(mapped);
        break;
      case "contract_deep_hierarchy":
        this.validateDeepHierarchyContract(mapped);
        break;
      case "dpr_by_code_primary":
      case "dpr_by_code_alt":
      case "dpr_ignore_unknown_query":
        this.validateLiveOk(mapped, expectedDtrCode);
        break;
      default:
        break;
    }
  }
}
