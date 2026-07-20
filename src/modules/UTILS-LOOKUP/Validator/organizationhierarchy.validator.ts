import { expect } from "@playwright/test";
import {OrganisationData,OrganisationResponse,} from "../Mapper/organizationhierarchy.mapper";
export class OrganisationValidator {
  validateResponse(response: OrganisationResponse): void {
    expect(response.success).toBeTruthy();
  }
  validateItemsExist(data: OrganisationData): void {
    expect(data.items.length).toBeGreaterThan(0);
  }
  validateFields(data: OrganisationData): void {
    data.items.forEach((item) => {
      expect(item.id).toBeGreaterThan(0);
      expect(item.code).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.order).toBeGreaterThan(0);
    });
  }
  validateDuplicateCodes(data: OrganisationData): void {
    const codes = data.items.map((x) => x.code);
    const unique = new Set(codes);
    expect(codes.length).toBe(unique.size);
  }
  validateOrderSequence(data: OrganisationData): void {
    data.items.forEach((item, index) => {
      expect(item.order).toBe(index + 1);
    });
  }
  validateExpectedHierarchy(data: OrganisationData): void {
    const expected = ["Discom", "Region", "Circle", "Division", "Zone"];
    const actual = data.items.map((x) => x.name);
    expected.forEach((value) => {
      expect(actual).toContain(value);
    });
  }
}
