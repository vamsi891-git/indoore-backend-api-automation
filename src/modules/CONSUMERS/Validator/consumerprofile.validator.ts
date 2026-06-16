import { expect } from "@playwright/test";
export class ConsumerProfileValidator {
    validateConsumerName(data: any): void {
        expect(data.consumerName).toBeTruthy();
        expect(typeof data.consumerName).toBe("string");
    }
    validateConsumerNumber(data: any): void {
        expect(data.consumerNumber).toMatch(/^\d+$/);
        expect(data.consumerNumber.length).toBeGreaterThan(5);
    }
    validateUniqueId(data: any): void {
        expect(data.uniqueId).toContain(data.consumerNumber);
        expect(data.uniqueId).toContain("N");
    }
    validateOccupancy(data: any): void {
        if (data.occupancyStatus == null) {
            return;
        }
        expect(["Occupied","Vacant"]).toContain(data.occupancyStatus);
    }
    validateAddress(data: any): void {
        expect(data.permanentAddress).toBeTruthy();
        expect(data.billingAddress).toBeTruthy();
        expect(data.permanentAddress.length).toBeGreaterThan(5);
    }
    validateConnectionDetails(data: any): void {
        const details =data.connectionDetails;
        expect(details).toBeDefined();
        expect(details.subDivision).toBeTruthy();
        expect(details.section).toBeTruthy();
        expect(details.subStation).toBeTruthy();
        expect(details.feeder).toBeTruthy();
        expect(details.dtr).toBeTruthy();
        expect(details.ivrsNo).toEqual(data.consumerNumber);
    }
    validateMeterDetails(data: any): void {
        const meter =data.connectionMeterDetails;
        expect(meter).toBeDefined();
        expect(meter.mainSubMeter).toBeTruthy();
        expect(meter.servicePointId).toEqual(data.consumerNumber);
        expect(meter.meterSerialNumber).toEqual(data.meterSerialNumber);
        expect(meter.meterType).toContain("Meter");
    }
    validateSanctionedLoad(data: any): void {
        expect(data.connectionDetails.sanctionedLoad).toContain("kW");
        expect(data.connectionDetails.sanctionedLoadKw).toBeGreaterThanOrEqual(0);
    }
    validatePhase(data: any): void {
        expect(["1 PH","3PH WC","3PH 4CT", "HT"]).toContain(data.connectionMeterDetails.meterPhase);
    }
    validateEmail(data: any): void {
        if (data.consumerEmail) {
            expect(data.consumerEmail).toMatch( /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        }
    } 
    validateActivities(data: any): void {
        expect(Array.isArray(data.latestActivities)).toBeTruthy();
    }
    validateBusinessRules(data: any): void {
        expect(data.connectionMeterDetails.servicePointId).toEqual(data.consumerNumber);
        expect(data.connectionDetails.ivrsNo).toEqual(data.consumerNumber);
        expect(data.connectionMeterDetails.meterSerialNumber).toEqual(data.meterSerialNumber);
    }
}