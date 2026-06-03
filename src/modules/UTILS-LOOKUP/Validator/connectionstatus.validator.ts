// Validator/connectionstatus.validator.ts
import { expect } from "@playwright/test";
import {ConnectionStatusData,ConnectionStatusResponse,
} from "../Mapper/connectionstatus.mapper";
export class ConnectionStatusValidator {
  validateResponse(response: ConnectionStatusResponse) {
    expect(response.success).toBeTruthy();
  }
  validateItemsExist(data: ConnectionStatusData) {
    expect(data.items.length).toBeGreaterThan(0);
  }
  validateFields(data: ConnectionStatusData) {
    data.items.forEach((item) => {
      expect(item.id).toBeGreaterThan(0);
      expect(item.name).toBeTruthy();
      expect(item.name.trim()).not.toEqual("");
      if (item.shortName != null) {
        expect(item.shortName.trim()).not.toEqual("");
      }
    });
  }
  validateDuplicateIds(data: ConnectionStatusData) {
    const ids = data.items.map((x) => x.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  }
  validateDuplicateNames(data: ConnectionStatusData) {
    const names = data.items.map((x) => x.name);
    const unique = new Set(names);
    expect(names.length).toBe(unique.size);
  }
  validateAscendingOrder(data: ConnectionStatusData) {
    data.items.forEach((item, index) => {
      if (index > 0) {
        expect(item.id).toBeGreaterThan(data.items[index - 1].id);
      }
    });
  }
  validateExpectedValues(data: ConnectionStatusData) {
    const expected = ["Connected", "Disconnected", "Permanent Disconnection"];
    const actual = data.items.map((x) => x.name);
    expected.forEach((status) => {
      expect(actual).toContain(status);
    });
  }
}
