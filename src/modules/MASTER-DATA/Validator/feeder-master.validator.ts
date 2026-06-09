// Validator/feeder-master.validator.ts
import { expect } from "@playwright/test";
import {
  FeederMasterData,
  FeederMasterResponse,
} from "../Mapper/feeder-master.mapper";
export class FeederMasterValidator {
  validateResponse(response: FeederMasterResponse) {
    expect(response.success).toBeTruthy();
  }
  validateItemsExist(data: FeederMasterData) {
    if (data.total > 0) {
      expect(data.items.length).toBeGreaterThan(0);
    } else {
      expect(data.items.length).toBe(0);
    }
  }
  validateFields(data: FeederMasterData) {
    data.items.forEach((item) => {
      expect(item.slNo).toBeGreaterThan(0);
      expect(item.feederName).toBeTruthy();
      expect(item.feederName.trim()).not.toEqual("");
    });
  }
  validatePagination(data: FeederMasterData) {
    expect(Math.ceil(data.total / data.limit)).toEqual(data.totalPages);
  }
  validateHierarchyFields(data: FeederMasterData) {
    data.items.forEach((item) => {
      expect(item.zoneName).toBeTruthy();
      expect(item.substationName).toBeTruthy();
    });
  }
  validateCounts(data: FeederMasterData) {
    data.items.forEach((item) => {
      expect(item.dtrCount).toBeGreaterThanOrEqual(0);
      expect(item.consumerCount).toBeGreaterThanOrEqual(0);
    });
  }

  validateSerialNumbers(data: FeederMasterData) {
    data.items.forEach((item, index) => {
      expect(item.slNo).toEqual(index + 1);
    });
  }

  validateConsumerDtrRelation(data: FeederMasterData) {
    data.items.forEach((item) => {
      if (item.consumerCount > 0) {
        expect(item.dtrCount).toBeGreaterThan(0);
      }
    });
  }
}
