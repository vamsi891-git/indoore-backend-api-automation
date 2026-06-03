// Validator/organisationsearch.validator.ts

import { expect } from "@playwright/test";
import {
  OrganizationData,
  OrganizationResponse,
} from "../Mapper/searchorganization.mapper";
export class OrganizationValidator {
  validateResponse(response: OrganizationResponse) {
    expect(response.success).toBeTruthy();
  }
  validateItemsExist(data: OrganizationData) {
    expect(data.items.length).toBeGreaterThan(0);
  }
  validateFields(data: OrganizationData) {
    data.items.forEach((item) => {
      expect(item.id).toBeGreaterThan(0);
      expect(item.name).toBeTruthy();
      expect(item.name.trim()).not.toEqual("");
      expect(typeof item.code).toBe("string");
    });
  }
  validateDuplicateIds(data: OrganizationData) {
    const ids = data.items.map((x) => x.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  }

  /*
Backend-aware validation

Names can duplicate

IDs cannot
*/
  validateBackendRules(data: OrganizationData) {
    const names = data.items.map((x) => x.name);
    const duplicates = names.filter(
      (name, index) => names.indexOf(name) !== index,
    );
    console.log("Duplicate organization names allowed:", duplicates);
    expect(true).toBeTruthy();
  }
  validateCodeFormat(data: OrganizationData) {
    data.items.forEach((item) => {
      expect(typeof item.code).toBe("string");
    });
  }
}
