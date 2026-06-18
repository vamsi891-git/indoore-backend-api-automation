// Validator/eventpriority.validator.ts

import { expect } from "@playwright/test";

import {
  EventPriorityData,
  EventPriorityResponse,
} from "../Mapper/eventpriority.mapper";

export class EventPriorityValidator {
  validateResponse(response: EventPriorityResponse) {
    expect(response.success).toBeTruthy();
  }

  validateItemsExist(data: EventPriorityData) {
    expect(data.items.length).toBeGreaterThan(0);
  }

  validateFields(data: EventPriorityData) {
    data.items.forEach((item) => {
      expect(item.priorityTblRefId).toBeGreaterThan(0);
    });
  }

  /*
backend:
SELECT DISTINCT
*/

  validateDuplicatePriorities(data: EventPriorityData) {
    const ids = data.items.map((x) => x.priorityTblRefId);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  }

  /*
ORDER BY ASC
*/

  validateAscendingOrder(data: EventPriorityData) {
    for (let i = 1; i < data.items.length; i++) {
      expect(data.items[i].priorityTblRefId).toBeGreaterThan(
        data.items[i - 1].priorityTblRefId,
      );
    }
  }

  validateExpectedValues(data: EventPriorityData) {
    const expected = [1, 2, 3];
    const actual = data.items.map((x) => x.priorityTblRefId);
    expected.forEach((value) => {
      expect(actual).toContain(value);
    });
  }
}
