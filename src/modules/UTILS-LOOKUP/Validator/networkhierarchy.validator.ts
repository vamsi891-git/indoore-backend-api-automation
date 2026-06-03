import { expect } from "@playwright/test";
import { NetworkData, NetworkResponse } from "../Mapper/networkhierarchy.mapper";
export class NetworkValidator {
  validateResponse(response: NetworkResponse): void {
    expect(response.success).toBeTruthy();
  }
  validateItemsExist(data: NetworkData): void {
    expect(data.items.length).toBeGreaterThan(0);
  }
  validateFields(data: NetworkData): void {
    data.items.forEach((item) => {
      expect(item.id).toBeGreaterThan(0);
      expect(item.code).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.order).toBeGreaterThan(0);
    });
  }
  validateDuplicateCodes(data: NetworkData): void {
    const codes = data.items.map((x) => x.code);
    const unique = new Set(codes);
    expect(codes.length).toBe(unique.size);
  }
  validateOrderSequence(data: NetworkData): void {
    data.items.forEach((item, index) => {
      expect(item.order).toBe(index + 1);
    });
  }
  validateExpectedHierarchy(data: NetworkData): void {
    const expected = ["Sub Station", "Feeder", "DTR"];
    const actual = data.items.map((x) => x.name);
    expected.forEach((value) => {
      expect(actual).toContain(value);
    });
  }
}
