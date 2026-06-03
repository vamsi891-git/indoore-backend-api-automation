// Validator/event.validator.ts
import { expect } from "@playwright/test";
import { EventData, EventResponse } from "../Mapper/event.mapper";
export class EventValidator {
  validateResponse(response: EventResponse) {
    expect(response.success).toBeTruthy();
  }
  validateItemsExist(data: EventData) {
    expect(data.items.length).toBeGreaterThan(0);
  }
  validateFields(data: EventData) {
    data.items.forEach((item) => {
      expect(item.id).toBeGreaterThan(0);
      expect(item.name).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(item.name.trim()).not.toEqual("");
      expect(item.description.trim()).not.toEqual("");
      if (item.code !== null) {
        expect(typeof item.code).toBe("number");
      }
      if (item.eventReferenceTable !== null) {
        expect(item.eventReferenceTable.trim()).not.toEqual("");
      }
    });
  }
  /*
backend:
ORDER BY Event_Name ASC
*/
  validateEventNames(data: EventData) {
    data.items.forEach((item) => {
      expect(item.name).toBeTruthy();
      expect(item.name.trim()).not.toEqual("");
    });
  }

  /*
duplicate names allowed
duplicate ids not allowed
*/
  validateDuplicateIds(data: EventData) {
    const ids = data.items.map((x) => x.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  }
  validateReferenceTables(data: EventData) {
    const allowed = [
      "Others",
      "Transaction",
      "Current",
      "Voltage",
      "Power",
      "Control",
      "NonRollover",
    ];
    data.items.forEach((item) => {
      if (item.eventReferenceTable) {
        expect(allowed).toContain(item.eventReferenceTable);
      }
    });
  }
  validateKnownEvents(data: EventData) {
    const expected = ["Power failure", "OverLoad", "Low Power Factor"];
    const actual = data.items.map((x) => x.name);
    expected.forEach((value) => {
      expect(actual).toContain(value);
    });
  }
}
