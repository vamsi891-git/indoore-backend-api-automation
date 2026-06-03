// Validator/meterphase.validator.ts
import { expect } from "@playwright/test";
import {
  MeterPhaseData,
  MeterPhaseResponse,
} from "../Mapper/meterphase.mapper";
export class MeterPhaseValidator {
  validateResponse(response: MeterPhaseResponse) {
    expect(response.success).toBeTruthy();
  }
  validateItemsExist(data: MeterPhaseData) {
    expect(data.items.length).toBeGreaterThan(0);
  }
  validateFields(data: MeterPhaseData) {
    data.items.forEach((item) => {
      expect(item.id).toBeGreaterThan(0);
      expect(item.name).toBeTruthy();
      expect(item.name.trim()).not.toEqual("");
    });
  }
  validateDuplicateIds(data: MeterPhaseData) {
    const ids = data.items.map((x) => x.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  }
  /*
Backend logic says lookup list
duplicate names not expected
*/
  validateDuplicateNames(data: MeterPhaseData) {
    const names = data.items.map((x) => x.name);
    const unique = new Set(names);
    expect(names.length).toBe(unique.size);
  }
  validateExpectedPhases(data: MeterPhaseData) {
    const expected = ["1 PH", "3PH WC", "HT"];
    const actual = data.items.map((x) => x.name);
    expected.forEach((phase) => {
      expect(actual).toContain(phase);
    });
  }
}
