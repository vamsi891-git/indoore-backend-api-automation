import { test, expect } from "@playwright/test";
import { NearestAccountIdsSuccessResponseSchema } from "../../schemas/consumers.schemas";
import { collectConsumersDataQualityFindings } from "../../Db/consumers-db.validator";
import { sampleNearestAccountIdsSuccess } from "./fixtures/consumers-sample.fixture";

test.describe("Mutation proof — Nearest Account IDs", () => {
  test("MUT-CON-NAI-001 — schema rejects missing nearestAccountIds", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleNearestAccountIdsSuccess);
    delete (mutated.data as Record<string, unknown>).nearestAccountIds;
    expect(NearestAccountIdsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-NAI-002 — schema rejects unexpected root field", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleNearestAccountIdsSuccess);
    (mutated as Record<string, unknown>).extra = true;
    expect(NearestAccountIdsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });
  test("MUT-CON-NAI-003 — data-quality flags duplicate account ids", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleNearestAccountIdsSuccess.data);
    mutated.nearestAccountIds.push({ ...mutated.nearestAccountIds[0] });
    const report = collectConsumersDataQualityFindings("nearest", mutated);
    expect(report.warnings.some((w) => /DUPLICATE/i.test(w.code))).toBe(true);
  });
});
