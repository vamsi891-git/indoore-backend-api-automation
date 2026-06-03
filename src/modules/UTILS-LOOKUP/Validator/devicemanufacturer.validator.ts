// Validator/devicemanufacturer.validator.ts

import { expect } from "@playwright/test";
import {DeviceManufacturerData,DeviceManufacturerResponse,} from "../Mapper/devicemanufacturer.mapper";
export class DeviceManufacturerValidator {
  validateResponse(response: DeviceManufacturerResponse) {
    expect(response.success).toBeTruthy();
  }
  validateItemsExist(data: DeviceManufacturerData) {
    expect(data.items.length).toBeGreaterThan(0);
  }
  validateFields(data: DeviceManufacturerData) {
    data.items.forEach((item) => {
      expect(item.id).toBeGreaterThan(0);
      expect(item.name).toBeTruthy();
      expect(item.name.trim()).not.toEqual("");
      if (item.code !== null) {
        expect(item.code.trim()).not.toEqual("");
      }
    });
  }
  validateDuplicateIds(data: DeviceManufacturerData) {
    const ids = data.items.map((x) => x.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  }
  validateDuplicateNames(data: DeviceManufacturerData) {
    const names = data.items.map((x) => x.name);
    const unique = new Set(names);
    expect(names.length).toBe(unique.size);
  }
  /*
backend uses DISTINCT ON ID
*/
  validateBackendRules(data: DeviceManufacturerData) {
    data.items.forEach((item) => {
      expect(item.id).toBeDefined();
    });
  }
  validateExpectedManufacturers(data: DeviceManufacturerData) {
    const expected = ["L&T", "HPL", "Genus"];
    const actual = data.items.map((x) => x.name);
    expected.forEach((value) => {
      expect(actual).toContain(value);
    });
  }
}
