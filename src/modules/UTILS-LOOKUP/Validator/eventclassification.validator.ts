// Validator/eventclassification.validator.ts

import { expect } from "@playwright/test";

import {
  EventClassificationData,
  EventClassificationResponse,
} from "../Mapper/eventclassification.mapper";

export class EventClassificationValidator {
  validateResponse(response: EventClassificationResponse) {
    expect(response.success).toBeTruthy();
  }
  validateItemsExist(data: EventClassificationData) {
    expect(data.items.length).toBeGreaterThan(0);
  }

  validateFields(data: EventClassificationData) {
    data.items.forEach((item) => {
      expect(item.EventClassificationTblRefId).toBeGreaterThan(0);
      expect(item.EventClassification_Name).toBeTruthy();
      expect(item.EventClassification_Name.trim()).not.toEqual("");
    });
  }
  validateDuplicateIds(data: EventClassificationData) {
    const ids = data.items.map((x) => x.EventClassificationTblRefId);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  }
  validateDuplicateNames(data: EventClassificationData) {
    const names = data.items.map((x) => x.EventClassification_Name);
    const unique = new Set(names);
    expect(names.length).toBe(unique.size);
  }
  validateExpectedValues(data: EventClassificationData) {
    const expected = ["Control", "Current", "Voltage"];
    const actual = data.items.map((x) => x.EventClassification_Name);
    expected.forEach((value) => {
      expect(actual).toContain(value);
    });
  }
}
