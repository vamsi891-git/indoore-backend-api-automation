import { expect } from "@playwright/test";
import { DtrMasterData, DtrMasterResponse } from "../Mapper/dtr-master.mapper";
export class DtrMasterValidator {
  validateResponse(response: DtrMasterResponse) {
    expect(response.success).toBeTruthy();
  }
  validateItemsExist(data: DtrMasterData) {
    expect(data.items.length).toBeGreaterThan(0);
  }
  validateFields(data: DtrMasterData) {
    data.items.forEach((item) => {
      expect(item.slNo).toBeGreaterThan(0);
      expect(item.dtrName).toBeTruthy();
      expect(item.dtrName.trim()).not.toEqual("");
    });
  }
  validatePagination(data: DtrMasterData) {
    expect(Math.ceil(data.total / data.limit)).toEqual(data.totalPages);
  }
  validateDuplicateDtrNames(data: DtrMasterData) {
    const names =data.items.map(x => x.dtrName);
    const duplicates =names.filter((name, index) =>names.indexOf(name)!== index);
    if (duplicates.length) {
      console.log("Duplicate DTR names found:",duplicates.length,"records",[...new Set(duplicates)]);
    }
  }
  validateAscendingOrder(data: DtrMasterData) {
    data.items.forEach((item, index) => {
      if (index > 0) {
        expect(
          item.dtrName.localeCompare(data.items[index - 1].dtrName),
        ).toBeGreaterThanOrEqual(0);
      }
    });
  }
  validateCoordinates(data: DtrMasterData) {
    data.items.forEach((item) => {
      if (item.latitude) {
        expect(isNaN(Number(item.latitude))).toBeFalsy();
      }
      if (item.longitude) {
        expect(isNaN(Number(item.longitude))).toBeFalsy();
      }
    });
  }
}
