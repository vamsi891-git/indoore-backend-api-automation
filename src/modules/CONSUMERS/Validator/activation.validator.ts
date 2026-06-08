import { expect } from "@playwright/test";
import {
    ActivationConsumer,
    ActivationData,
    ConsumerActivationStatus,
} from "../Mapper/activation.mapper";

const CONSUMER_REQUIRED_FIELDS = ["cid", "tblRefId", "name", "status"] as const;
const ALLOWED_STATUSES: ConsumerActivationStatus[] = ["active", "inactive"];

export class ActivationValidator {
    validateSuccess(success: boolean) {
        expect(success).toBeTruthy();
    }

    validateRootStructure(data: ActivationData) {
        expect(data.consumer).toBeDefined();
        expect(data.previousStatus).toBeDefined();
    }

    validateConsumerRequiredFields(consumer: ActivationConsumer) {
        CONSUMER_REQUIRED_FIELDS.forEach((field) => {
            expect(consumer).toHaveProperty(field);
        });
    }

    validateConsumerStructure(consumer: ActivationConsumer) {
        expect(typeof consumer.cid).toBe("string");
        expect(typeof consumer.tblRefId).toBe("number");
        expect(typeof consumer.name).toBe("string");
        expect(typeof consumer.status).toBe("string");
    }

    validateConsumerId(consumer: ActivationConsumer, consumerId: string) {
        expect(consumer.cid).toBe(consumerId);
        expect(consumer.cid.trim()).toBe(consumerId.trim());
    }

    validateTableRefId(consumer: ActivationConsumer) {
        expect(consumer.tblRefId).toBeGreaterThan(0);
        expect(Number.isFinite(consumer.tblRefId)).toBeTruthy();
        expect(Number.isNaN(consumer.tblRefId)).toBeFalsy();
    }

    validateConsumerName(consumer: ActivationConsumer) {
        expect(consumer.name.trim().length).toBeGreaterThan(0);
    }

    validateAllowedStatuses(
        consumer: ActivationConsumer,
        previousStatus: string,
    ) {
        expect(ALLOWED_STATUSES).toContain(
            consumer.status.toLowerCase() as ConsumerActivationStatus,
        );
        expect(ALLOWED_STATUSES).toContain(
            previousStatus.toLowerCase() as ConsumerActivationStatus,
        );
    }

    validateRequestStatusEcho(
        consumer: ActivationConsumer,
        requestStatus: string,
    ) {
        expect(consumer.status.toLowerCase()).toBe(requestStatus.toLowerCase());
    }

    validatePreviousStatus(previousStatus: string) {
        expect(previousStatus).not.toBeNull();
        expect(previousStatus).not.toBeUndefined();
        expect(previousStatus.trim().length).toBeGreaterThan(0);
    }

    validateStatusTransition(
        consumer: ActivationConsumer,
        previousStatus: string,
        requestStatus: string,
    ) {
        expect(consumer.status.toLowerCase()).toBe(requestStatus.toLowerCase());

        if (previousStatus.toLowerCase() === requestStatus.toLowerCase()) {
            expect(consumer.status.toLowerCase()).toBe(
                previousStatus.toLowerCase(),
            );
        }
    }

    validateNaNValues(consumer: ActivationConsumer) {
        expect(Number.isNaN(consumer.tblRefId)).toBeFalsy();
    }

    validateBusinessRules(consumer: ActivationConsumer) {
        expect(consumer.name.trim().length).toBeGreaterThan(0);
        expect(consumer.status.length).toBeGreaterThan(0);
        expect(consumer.cid.length).toBeGreaterThan(0);
    }

    validateDataPresentBackendRules(
        data: ActivationData,
        consumerId: string,
        requestStatus: string,
    ) {
        this.validateRootStructure(data);
        this.validateConsumerRequiredFields(data.consumer);
        this.validateConsumerStructure(data.consumer);
        this.validateConsumerId(data.consumer, consumerId);
        this.validateTableRefId(data.consumer);
        this.validateConsumerName(data.consumer);
        this.validateAllowedStatuses(data.consumer, data.previousStatus);
        this.validateRequestStatusEcho(data.consumer, requestStatus);
        this.validatePreviousStatus(data.previousStatus);
        this.validateStatusTransition(
            data.consumer,
            data.previousStatus,
            requestStatus,
        );
        this.validateNaNValues(data.consumer);
        this.validateBusinessRules(data.consumer);
    }
}
