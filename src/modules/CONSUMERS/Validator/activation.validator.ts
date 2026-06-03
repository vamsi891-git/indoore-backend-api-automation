import { expect } from "@playwright/test";
import { activationData } from "../Data/activation.data";
export class ActivationValidator {
    validateConsumer(data: any): void {
        expect(data.consumer).toBeDefined();
        expect(data.consumer.cid).toBeDefined();
        expect(data.consumer.tblRefId).toBeDefined();
        expect(data.consumer.name).toBeDefined();
        expect(data.consumer.status).toBeDefined();
    }
    validateTypes(data: any): void {
        expect(typeof data.consumer.cid).toBe("string");
        expect(typeof data.consumer.tblRefId).toBe("number");
        expect(typeof data.consumer.name).toBe("string");
        expect(typeof data.consumer.status).toBe("string");
        expect(typeof data.previousStatus).toBe("string");
    }
    validateConsumerId(data: any): void {
        expect(data.consumer.cid).toBe(activationData.consumerId);
    }
    validateTableRefId(data: any): void {
        expect(data.consumer.tblRefId).toBeGreaterThan(0);
    }
    validateConsumerName(data: any): void {
        expect(data.consumer.name.trim().length).toBeGreaterThan(0);
    }
    validateStatus(data: any): void {
        expect(activationData.allowedStatuses.includes(data.consumer.status.toLowerCase())).toBeTruthy();
        expect(activationData.allowedStatuses.includes(data.previousStatus.toLowerCase())).toBeTruthy();
    }
    validatePreviousStatus(data: any): void {
        expect(data.previousStatus).not.toBeNull();
        expect(data.previousStatus).not.toBeUndefined();
    }
    validateNaN(data: any): void {
        expect(Number.isNaN(data.consumer.tblRefId)).toBeFalsy();
    }
    /*
    backend validation
    */
    validateBackendLogic(data: any): void {
        expect(data.consumer.cid).toBe(activationData.consumerId);
        expect(data.consumer.tblRefId).toBeGreaterThan(0);
    }
    /*
    fallback validation
    */
    validateFallbackLogic(data: any): void  {
        expect(data.consumer).toBeDefined();
        expect(data.previousStatus).toBeDefined();
    }
    /*
    business validation
    */
    validateBusinessRules(data: any): void {
        expect(data.consumer.name.trim().length).toBeGreaterThan(0);
        expect(data.consumer.status.length).toBeGreaterThan(0);
    }
}