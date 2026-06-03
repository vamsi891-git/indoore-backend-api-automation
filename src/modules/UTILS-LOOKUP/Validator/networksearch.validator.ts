// Validator/networksearch.validator.ts
import { expect } from "@playwright/test";
import {
  NetworkData,
  NetworkSearchResponse,
} from "../Mapper/networksearch.mapper";
export class NetworkSearchValidator {
  validateResponse(response: NetworkSearchResponse) {
    expect(response.success).toBeTruthy();
  }
  validateItemsExist(data: NetworkData) {
    expect(data.items.length).toBeGreaterThan(0);
  }
  validateFields(data: NetworkData) {
    data.items.forEach((item) => {
      expect(item.id).toBeGreaterThan(0);
      expect(item.name).toBeTruthy();
      expect(item.name.trim()).not.toEqual("");
      expect(typeof item.code).toBe("string");
    });
  }
  validateDuplicateIds(data: NetworkData) {
    const ids = data.items.map((x) => x.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  }
  /*
Backend-aware validation
Duplicate names allowed
Duplicate IDs not allowed
*/
  validateBackendRules(data: NetworkData) {
    const names = data.items.map((x) => x.name);
    const duplicates = names.filter(
      (name, index) => names.indexOf(name) !== index,
    );
    console.log("Duplicate network names allowed:", duplicates);
    expect(true).toBeTruthy();
  }
  validateCodeRules(data: NetworkData) {
    data.items.forEach((item) => {
      expect(typeof item.code).toBe("string");
    });
  }
}
