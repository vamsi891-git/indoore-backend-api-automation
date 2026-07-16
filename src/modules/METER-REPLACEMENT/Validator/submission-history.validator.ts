import { expect } from "@playwright/test";
import {
  SubmissionHistoryData,
  SubmissionHistoryItem,
  SubmissionPagination,
  SubmissionStatus,
} from "../Mapper/submission-history.mapper";
const ALLOWED_STATUS: SubmissionStatus[] = [
  "PENDING",
  "COMPLETED",
];
const REQUIRED_ITEM_FIELDS = [
  "id",
  "consumerName",
  "oldMeterSerial",
  "newMeterSerial",
  "replacementReason",
  "status",
  "createdAt",
] as const;

const REQUIRED_PAGINATION_FIELDS = [
  "page",
  "limit",
  "total",
  "totalPages",
] as const;

const CREATED_DATE_PATTERN =
  /^\d{1,2}\s[A-Za-z]{3}\s\d{4},\s\d{1,2}:\d{2}\s(am|pm)$/i;
export class SubmissionHistoryValidator {
  validateSuccess(success: boolean) {
    expect(success).toBeTruthy();
  }
  validateRootStructure(data: SubmissionHistoryData) {
    expect(typeof data).toBe("object");
  }
  validateItemsArray(data: SubmissionHistoryData) {
    expect(Array.isArray(data.items)).toBeTruthy();
  }
  validatePaginationObject(data: SubmissionHistoryData) {
    expect(typeof data.pagination).toBe("object");
  }
  validatePaginationRequiredFields(
    pagination: SubmissionPagination,
  ) {
    REQUIRED_PAGINATION_FIELDS.forEach((field) => {
     expect(pagination).toHaveProperty(field);
    });
  }
  validatePaginationTypes(
    pagination: SubmissionPagination,
  ) {
    expect(typeof pagination.page).toBe("number");
    expect(typeof pagination.limit).toBe("number");
    expect(typeof pagination.total).toBe("number");
    expect(typeof pagination.totalPages).toBe("number");
  }
  validatePage(pagination: SubmissionPagination) {
    expect(pagination.page).toBeGreaterThan(0);
  }
  validateLimit(pagination: SubmissionPagination) {
    expect(pagination.limit).toBeGreaterThan(0);
  }
  validateTotal(pagination: SubmissionPagination) {
    expect(pagination.total).toBeGreaterThanOrEqual(0);
  }
  validateTotalPages(pagination: SubmissionPagination,) {
    expect(pagination.totalPages,).toBeGreaterThanOrEqual(0);
  }
  validatePaginationMath(pagination: SubmissionPagination,) {
    if (pagination.total === 0) {
      expect(pagination.totalPages,).toBe(0);
      return;
    }
    const expectedPages = Math.ceil(pagination.total /pagination.limit,);
    expect(pagination.totalPages,).toBe(expectedPages);
  }
  validateItemsLimit(data: SubmissionHistoryData,) {
    expect(data.items.length,).toBeLessThanOrEqual(data.pagination.limit,);
  }
  validateRequiredFields(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {REQUIRED_ITEM_FIELDS.forEach((field) => {
        expect(item).toHaveProperty(field);
      });
    });
  }
  validateId(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      expect(typeof item.id).toBe("number");
      expect(Number.isInteger(item.id)).toBeTruthy();
      expect(item.id).toBeGreaterThan(0);
    });
  }
  validateConsumerName(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      expect(typeof item.consumerName,).toBe("string");
      expect(item.consumerName.trim().length,).toBeGreaterThan(0);
    });
  }
  validateOldMeterSerial(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      expect(typeof item.oldMeterSerial,).toBe("string");
      expect(item.oldMeterSerial.trim().length,).toBeGreaterThan(0);
    });
  }
  validateNewMeterSerial(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      if (item.newMeterSerial === null) {
        return;
      }
      expect(typeof item.newMeterSerial,).toBe("string");
      expect(item.newMeterSerial.trim().length,).toBeGreaterThan(0);
    });
  }
  validateReplacementReason(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      if (item.replacementReason === null) {
        return;
      }
      expect(typeof item.replacementReason,).toBe("string");
      expect(item.replacementReason.trim().length,).toBeGreaterThan(0);
    });
  }

  validateStatus(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      expect(ALLOWED_STATUS,).toContain(item.status,);
    });
  }
  validateCreatedDate(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      expect(item.createdAt.length,).toBeGreaterThan(0);
      expect(CREATED_DATE_PATTERN.test(item.createdAt,),).toBeTruthy();
    });
  }
  validateUniqueIds(items: SubmissionHistoryItem[],) {
    const ids = items.map((item) => item.id,);
    expect(new Set(ids).size,).toBe(ids.length);
  }
  validateEmptyResult(data: SubmissionHistoryData,) {
    if (data.pagination.total !== 0) {
      return;
    }
    expect(data.items.length,).toBe(0);
    expect(data.pagination.totalPages,).toBe(0);
  }
  validateRowsPresent(data: SubmissionHistoryData,) {
    if (data.pagination.total > 0) {
      expect(data.items.length,).toBeGreaterThan(0);
    }
  }
  validateSingleRecord(items: SubmissionHistoryItem[],) {
    if (items.length === 1) {
      expect(items[0].id,).toBeGreaterThan(0);
    }
  }
  validateMultipleRecords(items: SubmissionHistoryItem[],) {
    if (items.length > 1) {
      expect(items.length,).toBeGreaterThan(1);
    }
  }
  validateConsumerNameTrim(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      expect(item.consumerName).toBe(item.consumerName.trim(),);
    });
  }

  validateOldMeterSerialTrim(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      expect(item.oldMeterSerial).toBe(item.oldMeterSerial.trim(),);
    });
  }
  validateNewMeterSerialTrim(items: SubmissionHistoryItem[],
  ) {
    items.forEach((item) => {
      if (item.newMeterSerial == null) {
        return;
      }
      expect(item.newMeterSerial).toBe(item.newMeterSerial.trim(),);
    });
  }
  validateReplacementReasonTrim(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      if (item.replacementReason == null) {
        return;
      }
      expect(item.replacementReason).toBe(item.replacementReason.trim(),);
    });
  }
  validateCreatedDateTrim(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      expect(item.createdAt).toBe(
        item.createdAt.trim(),
      );
    });
  }
  validatePaginationConsistency(data: SubmissionHistoryData,) {
    expect(data.pagination.total,).toBeGreaterThanOrEqual(data.items.length,);
  }
  validateBusinessRules(data: SubmissionHistoryData,) {
    expect(data).toHaveProperty("items");
    expect(data).toHaveProperty("pagination");
  }
  validateNoDuplicateRecords(items: SubmissionHistoryItem[],) {
    const unique = new Set(items.map((item) =>
          `${item.id}-${item.oldMeterSerial}-${item.createdAt}`,
      ),
    );
    expect(unique.size).toBe(items.length,);
  }
  validateNoExtraFields(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      expect(Object.keys(item).sort(),).toEqual([
        "consumerName",
        "createdAt",
        "id",
        "newMeterSerial",
        "oldMeterSerial",
        "replacementReason",
        "status",
      ]);
    });
  }
  validateItemObjectSize(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      expect(Object.keys(item).length,).toBe(7);
    });
  }
  validateResponseIntegrity(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.consumerName).toBeTruthy();
      expect(item.oldMeterSerial).toBeTruthy();
      expect(item.status).toBeTruthy();
      expect(item.createdAt).toBeTruthy();
    });
  }
  validateStringFields(items: SubmissionHistoryItem[], ) {
    items.forEach((item) => {
      expect(typeof item.consumerName,).toBe("string");
      expect(typeof item.oldMeterSerial,).toBe("string");
      expect(typeof item.createdAt,).toBe("string");
      if (item.newMeterSerial != null) {
        expect(typeof item.newMeterSerial,).toBe("string");
      }
      if (item.replacementReason != null) {
        expect(typeof item.replacementReason,).toBe("string");
      }
    });
  }
  validateNumericFields(items: SubmissionHistoryItem[],pagination: SubmissionPagination,) {
    items.forEach((item) => {
      expect(typeof item.id,).toBe("number");
    });
    expect(typeof pagination.page,).toBe("number");
    expect(typeof pagination.limit,).toBe("number");
    expect(typeof pagination.total,).toBe("number");
    expect(typeof pagination.totalPages,).toBe("number");
  }
  validateStatusDistribution(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      expect(ALLOWED_STATUS,).toContain(item.status,);
    });
  }
  validatePaginationRange(pagination: SubmissionPagination,) {
    expect(pagination.page,).toBeLessThanOrEqual(Math.max(pagination.totalPages,1,),
    );
  }
  validateItemsWhenTotalPositive(data: SubmissionHistoryData,) {
    if (data.pagination.total > 0) {
      expect(data.items.length,).toBeGreaterThan(0,);
    }
  }
  validateHistoryOrdering(items: SubmissionHistoryItem[],) {
    if (items.length < 2) {
      return;
    }
    for (let i = 0;i < items.length - 1;i++) {
      const current =Date.parse(items[i].createdAt,);
      const next =Date.parse(items[i + 1].createdAt,);
      if (!Number.isNaN(current) &&!Number.isNaN(next)) {
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  }

  validateConsumerNameLength(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      expect(item.consumerName.length,).toBeLessThanOrEqual(255,);
    });
  }
  validateMeterSerialLength(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      expect(item.oldMeterSerial.length,).toBeGreaterThan(0);
      expect(item.oldMeterSerial.length,).toBeLessThanOrEqual(
        100,
      );
      if (item.newMeterSerial) {
        expect(item.newMeterSerial.length,).toBeLessThanOrEqual(100);
      }
    });
  }
  validateReplacementReasonLength(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      if (item.replacementReason == null) {
        return;
      }
      expect(item.replacementReason.length,).toBeLessThanOrEqual(500,);
    });
  }
  validateNoNullCriticalFields(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      expect(item.id).not.toBeNull();
      expect(item.consumerName).not.toBeNull();
      expect(item.oldMeterSerial).not.toBeNull();
      expect(item.status).not.toBeNull();
      expect(item.createdAt).not.toBeNull();
    });

  }

  validateNoUndefinedCriticalFields(items: SubmissionHistoryItem[],) {
    items.forEach((item) => {
      expect(item.id).not.toBeUndefined();
      expect(item.consumerName).not.toBeUndefined();
      expect(item.oldMeterSerial).not.toBeUndefined();
      expect(item.status).not.toBeUndefined();
      expect(item.createdAt).not.toBeUndefined();
    });
  }
}