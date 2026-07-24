import { test, expect } from "@playwright/test";
import { AuthLoginSuccessResponseSchema } from "../../schemas/auth.schemas";
import {
  AuthSuccessResponseSchema,
  AuthMeStrictResponseSchema,
  AuthDevicesStrictResponseSchema,
  SentInvitationsStrictResponseSchema,
} from "../../schemas/auth-hardening.schemas";
import { collectAuthDataQualityFindings } from "../../Db/auth-db.validator";
import {
  sampleAuthLoginSuccess,
  sampleAuthMeSuccess,
  sampleAuthDevicesSuccess,
  sampleSentInvitationsSuccess,
  sampleAuthSuccess,
} from "./fixtures/auth-sample.fixture";

function expectAccepts(
  schema: { safeParse: (v: unknown) => { success: boolean } },
  sample: unknown,
): void {
  const result = schema.safeParse(sample);
  expect(result.success, JSON.stringify(result)).toBe(true);
}

function expectRejectsExtraRoot(
  schema: { safeParse: (v: unknown) => { success: boolean } },
  sample: object,
): void {
  const mutated = structuredClone(sample) as Record<string, unknown>;
  mutated.extraField = true;
  expect(schema.safeParse(mutated).success).toBe(false);
}

function expectRejectsSuccessFalse(
  schema: { safeParse: (v: unknown) => { success: boolean } },
  sample: object,
): void {
  const mutated = structuredClone(sample) as Record<string, unknown>;
  mutated.success = false;
  expect(schema.safeParse(mutated).success).toBe(false);
}

test.describe("Mutation proof — Login", () => {
  test(
    "MUT-AUTH-LOGIN-001 — accepts fixture",
    { tag: ["@mutation-proof", "@auth", "@login"] },
    async () => {
      expectAccepts(AuthLoginSuccessResponseSchema, sampleAuthLoginSuccess);
    },
  );

  test(
    "MUT-AUTH-LOGIN-002 — rejects success false",
    { tag: ["@mutation-proof", "@auth", "@login"] },
    async () => {
      expectRejectsSuccessFalse(
        AuthLoginSuccessResponseSchema,
        sampleAuthLoginSuccess,
      );
    },
  );

  test(
    "MUT-AUTH-LOGIN-003 — hardening rejects unexpected root field",
    { tag: ["@mutation-proof", "@auth", "@login"] },
    async () => {
      expectRejectsExtraRoot(AuthSuccessResponseSchema, sampleAuthSuccess);
    },
  );
});

test.describe("Mutation proof — Me", () => {
  test(
    "MUT-AUTH-ME-001 — accepts fixture",
    { tag: ["@mutation-proof", "@auth", "@me"] },
    async () => {
      expectAccepts(AuthMeStrictResponseSchema, sampleAuthMeSuccess);
    },
  );

  test(
    "MUT-AUTH-ME-002 — rejects success false",
    { tag: ["@mutation-proof", "@auth", "@me"] },
    async () => {
      expectRejectsSuccessFalse(AuthMeStrictResponseSchema, sampleAuthMeSuccess);
    },
  );

  test(
    "MUT-AUTH-ME-003 — rejects unexpected root field",
    { tag: ["@mutation-proof", "@auth", "@me"] },
    async () => {
      expectRejectsExtraRoot(AuthMeStrictResponseSchema, sampleAuthMeSuccess);
    },
  );

  test(
    "MUT-AUTH-ME-004 — rejects missing email",
    { tag: ["@mutation-proof", "@auth", "@me"] },
    async () => {
      const mutated = structuredClone(sampleAuthMeSuccess);
      delete (mutated.data.user as Record<string, unknown>).email;
      expect(AuthMeStrictResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );
});

test.describe("Mutation proof — Devices", () => {
  test(
    "MUT-AUTH-DEV-001 — accepts fixture",
    { tag: ["@mutation-proof", "@auth", "@devices"] },
    async () => {
      expectAccepts(AuthDevicesStrictResponseSchema, sampleAuthDevicesSuccess);
    },
  );

  test(
    "MUT-AUTH-DEV-002 — rejects success false",
    { tag: ["@mutation-proof", "@auth", "@devices"] },
    async () => {
      expectRejectsSuccessFalse(
        AuthDevicesStrictResponseSchema,
        sampleAuthDevicesSuccess,
      );
    },
  );

  test(
    "MUT-AUTH-DEV-003 — rejects unexpected root field",
    { tag: ["@mutation-proof", "@auth", "@devices"] },
    async () => {
      expectRejectsExtraRoot(
        AuthDevicesStrictResponseSchema,
        sampleAuthDevicesSuccess,
      );
    },
  );

  test(
    "MUT-AUTH-DEV-004 — rejects negative deviceCount",
    { tag: ["@mutation-proof", "@auth", "@devices"] },
    async () => {
      const mutated = structuredClone(sampleAuthDevicesSuccess);
      mutated.data.deviceGroups[0].deviceCount = -1;
      expect(AuthDevicesStrictResponseSchema.safeParse(mutated).success).toBe(
        false,
      );
    },
  );
});

test.describe("Mutation proof — Sent Invitations", () => {
  test(
    "MUT-AUTH-INV-001 — accepts fixture",
    { tag: ["@mutation-proof", "@auth", "@invite"] },
    async () => {
      expectAccepts(
        SentInvitationsStrictResponseSchema,
        sampleSentInvitationsSuccess,
      );
    },
  );

  test(
    "MUT-AUTH-INV-002 — rejects success false",
    { tag: ["@mutation-proof", "@auth", "@invite"] },
    async () => {
      expectRejectsSuccessFalse(
        SentInvitationsStrictResponseSchema,
        sampleSentInvitationsSuccess,
      );
    },
  );

  test(
    "MUT-AUTH-INV-003 — rejects unexpected root field",
    { tag: ["@mutation-proof", "@auth", "@invite"] },
    async () => {
      expectRejectsExtraRoot(
        SentInvitationsStrictResponseSchema,
        sampleSentInvitationsSuccess,
      );
    },
  );

  test(
    "MUT-AUTH-INV-004 — DQ flags blank name on generic list",
    { tag: ["@mutation-proof", "@auth", "@invite"] },
    async () => {
      const mutated = structuredClone(sampleAuthSuccess.data);
      mutated.items[0].name = "";
      const report = collectAuthDataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );
});
