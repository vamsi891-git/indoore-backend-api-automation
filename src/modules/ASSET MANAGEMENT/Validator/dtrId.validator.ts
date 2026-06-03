import { expect } from "@playwright/test";
import { DtrDetailData} from "../Mapper/dtrId.mapper";
export class DtrDetailValidator {
    validateDtrDataExists(data: DtrDetailData) {
        expect(data.dtrName).toBeTruthy();
    }
    validateDtrFields(data:DtrDetailData) {
        expect(data.dtrName.trim()).not.toEqual("");
        if (data.dtrCode?.trim()) {
            expect(data.dtrCode.trim()).not.toEqual("");
        }
        else {console.log("Empty DTR Code:",
                data.dtrName
            )
        }
        if (data.dtrMeter) {
            expect(data.dtrMeter.meterLookupId).toBeGreaterThan(0)
        }
    }
    validateConsumers(data:DtrDetailData) {
        data.consumers.forEach(consumer => {
                    expect(consumer.consumerTblRefId).toBeGreaterThan(0);
                    expect(consumer.consumerName).toBeTruthy();
                    consumer.meters.forEach(meter => {
                                expect(meter.meterLookupId).toBeGreaterThan(0);
                            }
                        )
                }
            )
    }
    validatePagination(data:DtrDetailData
    ) {
        expect(data.page).toBeGreaterThan(0);
        expect(data.limit).toBeGreaterThan(0);
        expect(data.total).toBeGreaterThanOrEqual(0);
        expect(data.totalPages).toBeGreaterThanOrEqual(0);
        if (data.total === 0) {
            expect(data.consumers.length).toBe(0);
        }
    }
    validateDuplicateConsumers(
        data:DtrDetailData
    ) {
        const ids =data.consumers.map(x =>x.consumerTblRefId);
        const duplicates =ids.filter((id, index) =>ids.indexOf(id) !== index);
        if (duplicates.length) {
            console.log("Duplicate Consumers:",duplicates)
        }
        expect(duplicates.length).toBe(0);
    }
}