import { expect } from "@playwright/test";
import { DaywiseBillingData} from "../Mapper/daywisebilling.mapper";
export class DaywiseBillingValidator {
    validateDataExists(data: DaywiseBillingData) {
        expect(data).toBeTruthy();
        expect(data.items).toBeDefined();
    }
    validatePagination(data: DaywiseBillingData) {
        expect(data.page).toBeGreaterThan(0)
        expect(data.limit).toBeGreaterThan(0);

        expect(data.total).toBeGreaterThanOrEqual(0);
        expect(data.totalPages).toBeGreaterThanOrEqual(0);
        expect(data.items.length).toBeLessThanOrEqual(data.limit)
        if (data.total > 0) {

            expect(data.totalPages)
                .toBe(
                    Math.ceil(
                        data.total /
                        data.limit
                    )
                );
        }

    }
    validateMonthYear(data: DaywiseBillingData,expectedMonth: number,expectedYear: number) {
        expect(data.month)
            .toBe(expectedMonth);
        expect(data.year)
            .toBe(expectedYear);

    }
    validateHasMoreFlag(data: DaywiseBillingData) {
        const expectedHasMore =data.total >(data.page * data.limit);
        expect(data.hasMore).toBe(expectedHasMore);
    }
    validateMeterDetails(data: DaywiseBillingData){
        data.items.forEach(item => {
            expect(item.slNo).toBeGreaterThan(0);
            expect(item.meterNumber).toBeTruthy();
            expect(item.phase).toBeTruthy();
            if (item.mf !== null) {
                expect(item.mf).toBeGreaterThan(0);
            }
            if (item.sanctionedLoadKw !== null) {
                expect(item.sanctionedLoadKw).toBeGreaterThanOrEqual(0);
            }
        });
    }
    validateConsumerData(data: DaywiseBillingData) {
        data.items.forEach(item => {
            if (item.consumerName) {
                expect(item.consumerName.trim()).not.toEqual("");
            }
            if (item.consumerAddress) {
                expect(item.consumerAddress.trim() ).not.toEqual("");
            }
            if (item.ivrsNumber) {
                expect(item.ivrsNumber.trim()).not.toEqual("");
            }
            if (item.tariff ) {
                expect(item.tariff.trim()).not.toEqual("");
            }
        });
    }
    validateDailyKwhValues( data: DaywiseBillingData ) {
        data.items.forEach(item => {
            const readings = [
                item.d1Kwh,
                item.d2Kwh,
                item.d3Kwh,
                item.d4Kwh,
                item.d5Kwh,
                item.d6Kwh,
                item.d7Kwh,
                item.d8Kwh,
                item.d9Kwh,
                item.d10Kwh,
                item.d11Kwh,
                item.d12Kwh,
                item.d13Kwh,
                item.d14Kwh,
                item.d15Kwh,
                item.d16Kwh,
                item.d17Kwh,
                item.d18Kwh,
                item.d19Kwh,
                item.d20Kwh,
                item.d21Kwh,
                item.d22Kwh,
                item.d23Kwh,
                item.d24Kwh,
                item.d25Kwh,
                item.d26Kwh,
                item.d27Kwh,
                item.d28Kwh,
                item.d29Kwh,
                item.d30Kwh,
                item.d31Kwh
            ];
            readings.forEach(value => {
                if (value !== null ) {
                    expect(value).toBeGreaterThanOrEqual(0);
                    expect(Number.isNaN(value) ).toBeFalsy();
                }
            });
        });
    }
    validateDailyReadingTrend(data: DaywiseBillingData) {
        data.items.forEach(item => {
            const readings = [
                item.d1Kwh,
                item.d2Kwh,
                item.d3Kwh,
                item.d4Kwh,
                item.d5Kwh,
                item.d6Kwh,
                item.d7Kwh,
                item.d8Kwh,
                item.d9Kwh,
                item.d10Kwh,
                item.d11Kwh,
                item.d12Kwh,
                item.d13Kwh,
                item.d14Kwh,
                item.d15Kwh,
                item.d16Kwh,
                item.d17Kwh,
                item.d18Kwh,
                item.d19Kwh,
                item.d20Kwh,
                item.d21Kwh,
                item.d22Kwh,
                item.d23Kwh,
                item.d24Kwh,
                item.d25Kwh,
                item.d26Kwh,
                item.d27Kwh,
                item.d28Kwh,
                item.d29Kwh,
                item.d30Kwh,
                item.d31Kwh
            ];
            for (let i = 1; i < readings.length;i++) {
                const previous =readings[i - 1];
                const current =readings[i];
                if ( previous !== null && current !== null) {
                    expect(current).toBeGreaterThanOrEqual(previous);
                }
            }
        });
    }
    validateDuplicateMeters(data: DaywiseBillingData) {
        const meters =data.items.map(item =>item.meterNumber);
        const duplicates =meters.filter((value,index) =>meters.indexOf(value) !== index
            );
        if (duplicates.length) {
            console.log("Duplicate Meters:",duplicates);
        }
        expect(duplicates.length).toBe(0);
    }
    validateDuplicateSlNos(data: DaywiseBillingData) {
        const slNos = data.items.map( item => item.slNo);
        const duplicates =slNos.filter((value,index) =>slNos.indexOf( value) !== index);
        if (duplicates.length) {
            console.log("Duplicate SL Numbers:", duplicates);
        }
        expect(duplicates.length).toBe(0);
    }
    validateNoDataScenario(data: DaywiseBillingData) {
        if (data.total === 0) {
            expect(data.items.length).toBe(0);
        }
    }
    validateNullSafeFields(data: DaywiseBillingData) {
        data.items.forEach(item => {
            if ( item.division !== null ) {
                expect(typeof item.division).toBe("string");
            }
            if (item.zone !== null) {
                expect(typeof item.zone).toBe("string");
            }
            if (item.feeder !== null) {
                expect(typeof item.feeder).toBe("string");
            }
            if (item.dtr !== null) {
                expect(typeof item.dtr).toBe("string");
            }
        });
    }
}