// Validator/substation-master.validator.ts
import { expect } from "@playwright/test";
import {
  SubstationMasterData,
  SubstationMasterResponse,
} from "../Mapper/substation-master.mapper";
export class SubstationMasterValidator {
  validateResponse(response: SubstationMasterResponse) {
    expect(response.success).toBeTruthy();
  }
  validateItemsExist(data: SubstationMasterData) {
    if (data.total > 0) {
      expect(data.items.length).toBeGreaterThan(0);
    } else {
      expect(data.items.length).toBe(0);
    }
  }
  validateFields(data: SubstationMasterData) {
    data.items.forEach((item) => {
      expect(item.slNo).toBeGreaterThan(0);
      expect(item.substationName).toBeTruthy();
      expect(item.substationName.trim()).not.toEqual("");
      expect(item.substationCode).toBeTruthy();
    });
  }
  validatePagination(data: SubstationMasterData) {
    expect(Math.ceil(data.total / data.limit)).toEqual(data.totalPages);
  }
  validateHierarchyFields(data: SubstationMasterData) {
    data.items.forEach((item) => {
      expect(item.zoneName).toBeTruthy();
    });
  }
  validateCounts(data: SubstationMasterData) {
    data.items.forEach((item) => {
      expect(item.dtrCount).toBeGreaterThanOrEqual(0);
      expect(item.consumerCount).toBeGreaterThanOrEqual(0);
    });
  }
  validateSerialNumbers(data: SubstationMasterData) {
    data.items.forEach((item, index) => {
      expect(item.slNo).toEqual(index + 1);
    });
  }
  validateConsumerDtrRelation(data: SubstationMasterData) {
    data.items.forEach((item) => {
      if (item.consumerCount > 0) {
        expect(item.dtrCount).toBeGreaterThan(0);
      }
    });
  }
}
