import { test, expect } from "@playwright/test";
import { DtrDetailValidator } from "../../Validator/dtrId.validator";
import { DtrDetailSuccessResponseSchema } from "../../schemas/asset-management.schemas";
import { AssetManagementCommonValidator } from "../../Validator/asset-management-common.validator";
import { collectDtrDetailDataQualityFindings } from "../../Db/asset-management-db.validator";
import { captureThrownMessage } from "./fixtures/capture-throw";
import { sampleDtrDetailSuccess } from "./fixtures/asset-sample.fixture";
import type { DtrDetailData } from "../../Mapper/dtrId.mapper";

test.describe("Mutation proof — DTR detail", () => {
  test(
    "MUT-AM-DTR-001 — schema rejects empty consumerName",
    { tag: ["@mutation-proof", "@asset-management", "@dtr-detail"] },
    async () => {
      const mutated = structuredClone(sampleDtrDetailSuccess);
      mutated.data.consumers[0].consumerName = "";
      const result = DtrDetailSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/consumerName/i);
      }
    },
  );

  test(
    "MUT-AM-DTR-002 — schema fails when consumerTblRefId is removed",
    { tag: ["@mutation-proof", "@asset-management", "@dtr-detail"] },
    async () => {
      const mutated = structuredClone(sampleDtrDetailSuccess);
      delete (mutated.data.consumers[0] as Record<string, unknown>)
        .consumerTblRefId;
      const result = DtrDetailSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /consumerTblRefId/i,
        );
      }
    },
  );

  test(
    "MUT-AM-DTR-003 — schema rejects unexpected consumer field (.strict())",
    { tag: ["@mutation-proof", "@asset-management", "@dtr-detail"] },
    async () => {
      const mutated = structuredClone(sampleDtrDetailSuccess);
      (mutated.data.consumers[0] as Record<string, unknown>).debugFlag = true;
      const result = DtrDetailSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );

  test(
    "MUT-AM-DTR-004 — validatePaginationConsistency fails when totalPages is off-by-one",
    { tag: ["@mutation-proof", "@asset-management", "@dtr-detail"] },
    async () => {
      const mutated: DtrDetailData = {
        ...structuredClone(sampleDtrDetailSuccess.data),
        // total=25, limit=20 → correct totalPages=2; mutate to 3
        totalPages: 3,
      };
      const message = captureThrownMessage(() =>
        AssetManagementCommonValidator.validatePaginationConsistency(
          mutated,
          1,
          20,
        ),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/totalPages|2|3|expected|Received/i);
    },
  );

  test(
    "MUT-AM-DTR-005 — validateConsumers fails when consumerName is blank",
    { tag: ["@mutation-proof", "@asset-management", "@dtr-detail"] },
    async () => {
      const mutated: DtrDetailData = structuredClone(
        sampleDtrDetailSuccess.data,
      );
      mutated.consumers[0].consumerName = "";
      const message = captureThrownMessage(() =>
        new DtrDetailValidator().validateConsumers(mutated),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/truthy|expected|Received|toBeTruthy/i);
    },
  );

  test(
    "MUT-AM-DTR-006 — schema rejects negative meterLookupId",
    { tag: ["@mutation-proof", "@asset-management", "@dtr-detail"] },
    async () => {
      const mutated = structuredClone(sampleDtrDetailSuccess);
      mutated.data.consumers[0].meters[0].meterLookupId = -1;
      const result = DtrDetailSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/meterLookupId/i);
      }
    },
  );

  test("MUT-AM-DTR-007 — schema rejects meters = null",
    { tag: ["@mutation-proof", "@asset-management", "@dtr-detail"] },
    async () => {
      const mutated = structuredClone(sampleDtrDetailSuccess);
      (mutated.data.consumers[0] as Record<string, unknown>).meters = null;
      const result = DtrDetailSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/meters/i);
      }
    },
  );

  test("MUT-AM-DTR-008 — schema rejects non-string meterSerialNumber",
    { tag: ["@mutation-proof", "@asset-management", "@dtr-detail"] },
    async () => {
      const mutated = structuredClone(sampleDtrDetailSuccess);
      (mutated.data.consumers[0].meters[0] as Record<string, unknown>).meterSerialNumber =
        12345;
      const result = DtrDetailSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /meterSerialNumber/i,
        );
      }
    },
  );

  test("MUT-AM-DTR-009 — empty accountId is schema-allowed; data-quality flags it",
    { tag: ["@mutation-proof", "@asset-management", "@dtr-detail"] },
    async () => {
      const mutated = structuredClone(sampleDtrDetailSuccess);
      mutated.data.consumers[0].accountId = "";
      expect(DtrDetailSuccessResponseSchema.safeParse(mutated).success).toBe(
        true,
      );
      const report = collectDtrDetailDataQualityFindings(mutated.data);
      expect(report.counts.emptyAccountId).toBeGreaterThan(0);
    },
  );

  test("MUT-AM-DTR-010 — empty rrNumber is schema-allowed; data-quality flags it",
    { tag: ["@mutation-proof", "@asset-management", "@dtr-detail"] },
    async () => {

      const mutated = structuredClone(sampleDtrDetailSuccess);
      mutated.data.consumers[0].rrNumber = "";
      expect(DtrDetailSuccessResponseSchema.safeParse(mutated).success).toBe(
        true,
      );
      const report = collectDtrDetailDataQualityFindings(mutated.data);
      expect(report.counts.emptyRrNumber).toBeGreaterThan(0);
    },
  );
});
