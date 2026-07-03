import { expect } from "@playwright/test";
import { DtrDetailData} from "../Mapper/dtrId.mapper";
import { AssetManagementCommonValidator } from "./asset-management-common.validator";
import { DtrDetailSuccessResponseSchema } from "../schemas/asset-management.schemas";

export class DtrDetailValidator {

    validateResponse(body: unknown) {
        AssetManagementCommonValidator.validateSuccessEnvelope(body as { success?: boolean });
        AssetManagementCommonValidator.validateZodResponseSchema(
            body,
            DtrDetailSuccessResponseSchema,
        );
    }
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

    validateConsumerFieldCoverage(data: DtrDetailData) {
        data.consumers.forEach((consumer) => {
            expect(typeof consumer.consumerCid).toBe("string");
            expect(typeof consumer.consumerAddress).toBe("string");
            expect(typeof consumer.accountId).toBe("string");
            expect(typeof consumer.rrNumber).toBe("string");
            expect(consumer.consumerName.trim().length).toBeGreaterThan(0);
        });
    }

    validateMeterFieldCoverage(data: DtrDetailData) {
        data.consumers.forEach((consumer) => {
            consumer.meters.forEach((meter) => {
                expect(typeof meter.meterSerialNumber).toBe("string");
                if (meter.latitude != null) {
                    expect(typeof meter.latitude).toBe("string");
                }
                if (meter.longitude != null) {
                    expect(typeof meter.longitude).toBe("string");
                }
            });
        });

        if (data.dtrMeter) {
            expect(typeof data.dtrMeter.meterSerialNumber).toBe("string");
        }
    }
    validatePagination(data:DtrDetailData) {
        expect(data.page).toBeGreaterThan(0);
        expect(data.limit).toBeGreaterThan(0);
        expect(data.total).toBeGreaterThanOrEqual(0);
        expect(data.totalPages).toBeGreaterThanOrEqual(0);
        if (data.total === 0) {
            expect(data.consumers.length).toBe(0);
        }
    }

    validatePaginationConsistency(
        data: DtrDetailData,
        requestedPage: number,
        requestedLimit: number,
    ) {
        AssetManagementCommonValidator.validatePaginationConsistency(
            data,
            requestedPage,
            requestedLimit,
        );
    }

    validateLastPageConsumers(data: DtrDetailData, requestedPage: number) {
        AssetManagementCommonValidator.validateLastPageConsumers(data, requestedPage);
    }

    validateConsumerMeterUniqueness(data: DtrDetailData) {
        data.consumers.forEach((consumer) => {
            const meterIds = consumer.meters.map((m) => m.meterLookupId);
            expect(new Set(meterIds).size).toEqual(meterIds.length);
        });
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