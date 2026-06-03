import { expect } from "@playwright/test";
import {
  ConsumerMasterResponse,
  ConsumerMasterData,
} from "../Mapper/consumer-master.mapper";
export class ConsumerMasterValidator {
  validateResponse(response: ConsumerMasterResponse) {
    expect(response.success).toBeTruthy();
  }
  validateItemsExist(data: ConsumerMasterData) {
    expect(data.items.length).toBeGreaterThan(0);
  }
  validateFields(data: ConsumerMasterData) {
    data.items.forEach(item => {
      expect(item.slNo).toBeGreaterThan(0);
      expect(item.meterLookupTblRefId).toBeGreaterThan(0);
      expect(item.meterSerialNumber).toBeTruthy();
      expect(item.meterPhase).toBeTruthy();
    });
  }

  validateDuplicateConsumerIds(data: ConsumerMasterData) {
    const ids =data.items.map(x => x.meterLookupTblRefId);
    const unique =new Set(ids);
    expect(ids.length).toBe(unique.size);
  }
  validatePagination(data: ConsumerMasterData) {
    expect(Math.ceil(data.total / data.limit)).toEqual(data.totalPages);
  }
  validateMeterPhases(data: ConsumerMasterData) {
    const allowed = ["1 PH", "3PH WC", "HT"];
    data.items.forEach((item) => {
      expect(allowed).toContain(item.meterPhase);
    });
  }
  validateHierarchyFields(data: ConsumerMasterData) {
    data.items.forEach((item) => {
      if (item.division) {
        expect(item.division.trim()).not.toEqual("");
      }
      if (item.zone) {
        expect(item.zone.trim()).not.toEqual("");
      }
      if (item.subStation) {
        expect(item.subStation.trim()).not.toEqual("");
      }
    });
  }
}
