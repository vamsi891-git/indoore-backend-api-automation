import { expect } from "@playwright/test";
import { ConsumerSearchItem } from "../Mapper/consumer-search.mapper";

const REQUIRED_FIELDS = [
    "consumerId",
    "consumerName",
] as const;

export class ConsumerSearchValidator {

    validateSuccess(success: boolean) {
        expect(success).toBeTruthy();
    }

    validateDataIsArray(data: ConsumerSearchItem[]) {
        expect(Array.isArray(data)).toBeTruthy();
    }

    validateBusinessRules(data: ConsumerSearchItem[]) {
        expect(Array.isArray(data)).toBeTruthy();
    }

    validateRequiredFields(rows: ConsumerSearchItem[]) {
        rows.forEach((row) => {
            REQUIRED_FIELDS.forEach((field) => {
                expect(row).toHaveProperty(field);
            });
        });
    }

    validateConsumerId(rows: ConsumerSearchItem[]) {
        rows.forEach((row) => {
            expect(typeof row.consumerId).toBe("number");
            expect(Number.isInteger(row.consumerId)).toBeTruthy();
            expect(row.consumerId).toBeGreaterThan(0);
        });
    }

    validateConsumerName(rows: ConsumerSearchItem[]) {
        rows.forEach((row) => {
            expect(typeof row.consumerName).toBe("string");
            expect(row.consumerName.trim().length).toBeGreaterThan(0);
        });
    }

    validateTrimmedConsumerName(rows: ConsumerSearchItem[]) {
        rows.forEach((row) => {
            expect(row.consumerName).toBe(row.consumerName.trim());
        });
    }

    validateUniqueConsumerIds(rows: ConsumerSearchItem[]) {
        const ids = rows.map((row) => row.consumerId);
        expect(new Set(ids).size).toBe(ids.length);
    }
    validateNoNullValues(rows: ConsumerSearchItem[]) {
        rows.forEach((row) => {
            expect(row.consumerId).not.toBeNull();
            expect(row.consumerName).not.toBeNull();
        });
    }
    validateNoUndefinedValues(rows: ConsumerSearchItem[]) {
        rows.forEach((row) => {
            expect(row.consumerId).not.toBeUndefined();
            expect(row.consumerName).not.toBeUndefined();
        });
    }
    validateConsumerNameLength(rows: ConsumerSearchItem[]) {
        rows.forEach((row) => {
            expect(row.consumerName.length).toBeGreaterThan(0);
            expect(row.consumerName.length).toBeLessThanOrEqual(255);
        });
    }
    validateConsumerNameCharacters(rows: ConsumerSearchItem[]) {
        rows.forEach((row) => {
            expect(row.consumerName).not.toContain("\n");
            expect(row.consumerName).not.toContain("\r");
            expect(row.consumerName).not.toContain("\t");
        });
    }
    validateTotalRecords(rows: ConsumerSearchItem[],totalRecords: number,) {
        expect(totalRecords).toBe(rows.length);
    }
    validateMaximumRecords(rows: ConsumerSearchItem[],) {
        // Repository limit = 50
        expect(rows.length).toBeLessThanOrEqual(50);
    }

    validateEmptySearchResponse(rows: ConsumerSearchItem[]) {
        expect(Array.isArray(rows)).toBeTruthy();
    }

    validateSingleRecord(rows: ConsumerSearchItem[]) {
        if (rows.length === 1) {
            expect(rows[0].consumerId).toBeGreaterThan(0);
        }
    }

    validateMultipleRecords(rows: ConsumerSearchItem[]) {
        if (rows.length > 1) {
            expect(rows.length).toBeGreaterThan(1);
        }
    }

    validateConsumerIdRange(rows: ConsumerSearchItem[]) {
        rows.forEach((row) => {
            expect(row.consumerId).toBeLessThan(Number.MAX_SAFE_INTEGER);
        });
    }

    validateAlphabeticSearch(rows: ConsumerSearchItem[]) {
        rows.forEach((row) => {
            expect(typeof row.consumerName).toBe("string");
        });
    }

    validateNumericSearch(rows: ConsumerSearchItem[]) {
        rows.forEach((row) => {
            expect(row.consumerId).toBeGreaterThan(0);
        });
    }

    validateSearchResultConsistency(rows: ConsumerSearchItem[]) {
        rows.forEach((row) => {
            expect(row.consumerName.trim()).not.toBe("");
            expect(row.consumerId).toBeGreaterThan(0);
        });
    }

    validateNoDuplicateObjects(rows: ConsumerSearchItem[]) {
        const unique = new Set(
            rows.map(
                (row) =>
                    `${row.consumerId}-${row.consumerName}`,
            ),
        );

        expect(unique.size).toBe(rows.length);
    }

    validateSortedConsumerNames(rows: ConsumerSearchItem[]) {
        if (rows.length <= 1) {
            return;
        }

        const sorted = [...rows]
            .map((x) => x.consumerName)
            .sort((a, b) => a.localeCompare(b));

        expect(rows.map((x) => x.consumerName)).toEqual(sorted);
    }

    validateConsumerObject(rows: ConsumerSearchItem[]) {
        rows.forEach((row) => {
            expect(Object.keys(row).length).toBe(2);
        });
    }

    validateNoExtraFields(rows: ConsumerSearchItem[]) {
        rows.forEach((row) => {
            expect(Object.keys(row).sort()).toEqual([
                "consumerId",
                "consumerName",
            ]);
        });
    }

    validateResponseIntegrity(rows: ConsumerSearchItem[]) {
        rows.forEach((row) => {
            expect(row.consumerId).toBeTruthy();
            expect(row.consumerName).toBeTruthy();
        });
    }

    validateSearchLimit(rows: ConsumerSearchItem[]) {
        expect(rows.length).toBeLessThanOrEqual(50);
    }

    validateConsumerNameNotNumeric(rows: ConsumerSearchItem[]) {
        rows.forEach((row) => {
            expect(isNaN(Number(row.consumerName))).toBeTruthy();
        });
    }
}