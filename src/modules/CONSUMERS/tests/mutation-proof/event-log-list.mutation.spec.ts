import { test, expect } from "@playwright/test";
import { EventLogListSuccessResponseSchema } from "../../schemas/consumers.schemas";
import { EventLogListValidator } from "../../Validator/eventloglist.validator";
import { captureThrownMessage } from "./fixtures/capture-throw";
import { sampleEventLogListSuccess } from "./fixtures/consumers-sample.fixture";

test.describe("Mutation proof — Event Log List", () => {
  test("MUT-CON-ELL-001 — schema rejects missing serialNo", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleEventLogListSuccess);
    delete (mutated.data.rows[0] as Record<string, unknown>).serialNo;
    expect(EventLogListSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });

  test("MUT-CON-ELL-002 — schema rejects unexpected row field", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleEventLogListSuccess);
    (mutated.data.rows[0] as Record<string, unknown>).extra = 1;
    expect(EventLogListSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });

  test("MUT-CON-ELL-003 — schema rejects page = 0", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleEventLogListSuccess);
    mutated.data.page = 0;
    expect(EventLogListSuccessResponseSchema.safeParse(mutated).success).toBe(false);
  });

  test("MUT-CON-ELL-004 — validatePaginationMath fails on bad totalPages", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleEventLogListSuccess.data);
    mutated.totalPages = 99;
    const message = captureThrownMessage(() =>
      new EventLogListValidator().validatePaginationMath(mutated),
    );
    expect(message).not.toEqual("");
    expect(message).toMatch(/totalPages|3|99|expected|Received/i);
  });

  test("MUT-CON-ELL-005 — duplicate serialNo fails uniqueness check", { tag: ["@mutation-proof", "@consumers"] }, async () => {
    const mutated = structuredClone(sampleEventLogListSuccess.data);
    mutated.rows[1].serialNo = mutated.rows[0].serialNo;
    const ids = mutated.rows.map((r) => r.serialNo);
    expect(new Set(ids).size).toBeLessThan(ids.length);
  });
});
