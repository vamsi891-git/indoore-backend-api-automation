import { expect } from "@playwright/test";
import { DtrMasterData, DtrMasterResponse } from "../Mapper/dtr-master.mapper";

export class DtrMasterValidator {
  validateResponse(response: DtrMasterResponse) {
    expect(response.success).toBeTruthy();
  }

  validateItemsExist(data: DtrMasterData) {
    if (data.total > 0) {
      expect(data.items.length).toBeGreaterThan(0);
    } else {
      expect(data.items.length).toBe(0);
    }
  }

  validateFields(data: DtrMasterData) {
    data.items.forEach((item) => {
      expect(item.slNo).toBeGreaterThan(0);
      expect(item.id).toBeTruthy();
      expect(item.id.trim()).not.toEqual("");
      expect(item.dtr).toBeTruthy();
      expect(item.dtr.trim()).not.toEqual("");
      expect(item.id).toEqual(item.dtr);

      if (item.circle !== null) {
        expect(item.circle.trim()).not.toEqual("");
      }
      if (item.division !== null) {
        expect(item.division.trim()).not.toEqual("");
      }
      if (item.zone !== null) {
        expect(item.zone.trim()).not.toEqual("");
      }
      if (item.subStation !== null) {
        expect(item.subStation.trim()).not.toEqual("");
      }
      if (item.feeder !== null) {
        expect(item.feeder.trim()).not.toEqual("");
      }
      if (item.meterSerialNumber !== null) {
        expect(item.meterSerialNumber.trim()).not.toEqual("");
      }
      if (item.mf !== null) {
        expect(item.mf.trim()).not.toEqual("");
        expect(isNaN(Number(item.mf))).toBeFalsy();
      }
      if (item.serviceDate !== null) {
        expect(item.serviceDate.trim()).not.toEqual("");
      }
    });
  }

  validatePagination(data: DtrMasterData) {
    expect(Math.ceil(data.total / data.limit)).toEqual(data.totalPages);
  }

  /** Same DTR may appear on multiple rows (one row per meter). Log only. */
  validateDuplicateDtrNames(data: DtrMasterData) {
    const names = data.items.map((x) => x.dtr);
    const duplicates = names.filter(
      (name, index) => names.indexOf(name) !== index,
    );
    if (duplicates.length) {
      console.log(
        "Duplicate DTR codes on page (multiple meters per DTR):",
        duplicates.length,
        "records",
        [...new Set(duplicates)],
      );
    }
  }

  validateUniqueMeterSerials(data: DtrMasterData) {
    const serials = data.items
      .map((x) => x.meterSerialNumber?.trim())
      .filter((msn): msn is string => Boolean(msn));
    const unique = new Set(serials);
    expect(serials.length).toBe(unique.size);
  }

  validateAscendingOrder(data: DtrMasterData) {
    data.items.forEach((item, index) => {
      if (index > 0) {
        expect(
          item.dtr.localeCompare(data.items[index - 1].dtr),
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
