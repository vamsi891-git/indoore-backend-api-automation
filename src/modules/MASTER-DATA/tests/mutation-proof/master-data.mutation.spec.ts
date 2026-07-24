import { test, expect } from "@playwright/test";
import {
  MeterMasterStrictSuccessResponseSchema,
  DtrMasterStrictSuccessResponseSchema,
  ConsumerMasterStrictSuccessResponseSchema,
  FeederMasterStrictSuccessResponseSchema,
  SubstationMasterStrictSuccessResponseSchema,
  MeterCommunicationStrictSuccessResponseSchema,
} from "../../schemas/master-data-hardening.schemas";
import { collectMasterDataDataQualityFindings } from "../../Db/master-data-db.validator";
import {
  sampleMeterMasterSuccess,
  sampleDtrMasterSuccess,
  sampleConsumerMasterSuccess,
  sampleFeederMasterSuccess,
  sampleSubstationMasterSuccess,
  sampleMeterCommunicationSuccess,
} from "./fixtures/master-data-sample.fixture";

function expectAccepts(
  schema: { safeParse: (v: unknown) => { success: boolean } },
  sample: unknown,
): void {
  expect(schema.safeParse(sample).success).toBe(true);
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

test.describe("Mutation proof — Meter Master", () => {
  test(
    "MUT-MASTER-MM-001 — accepts fixture",
    { tag: ["@mutation-proof", "@master-data", "@meter-master"] },
    async () => {
      expectAccepts(MeterMasterStrictSuccessResponseSchema, sampleMeterMasterSuccess);
    },
  );

  test(
    "MUT-MASTER-MM-002 — rejects success false",
    { tag: ["@mutation-proof", "@master-data", "@meter-master"] },
    async () => {
      expectRejectsSuccessFalse(
        MeterMasterStrictSuccessResponseSchema,
        sampleMeterMasterSuccess,
      );
    },
  );

  test(
    "MUT-MASTER-MM-003 — rejects unexpected root field",
    { tag: ["@mutation-proof", "@master-data", "@meter-master"] },
    async () => {
      expectRejectsExtraRoot(
        MeterMasterStrictSuccessResponseSchema,
        sampleMeterMasterSuccess,
      );
    },
  );
});

test.describe("Mutation proof — DTR Master", () => {
  test(
    "MUT-MASTER-DTR-001 — accepts fixture",
    { tag: ["@mutation-proof", "@master-data", "@dtr-master"] },
    async () => {
      expectAccepts(DtrMasterStrictSuccessResponseSchema, sampleDtrMasterSuccess);
    },
  );

  test(
    "MUT-MASTER-DTR-002 — rejects success false",
    { tag: ["@mutation-proof", "@master-data", "@dtr-master"] },
    async () => {
      expectRejectsSuccessFalse(
        DtrMasterStrictSuccessResponseSchema,
        sampleDtrMasterSuccess,
      );
    },
  );

  test(
    "MUT-MASTER-DTR-003 — rejects unexpected root field",
    { tag: ["@mutation-proof", "@master-data", "@dtr-master"] },
    async () => {
      expectRejectsExtraRoot(
        DtrMasterStrictSuccessResponseSchema,
        sampleDtrMasterSuccess,
      );
    },
  );

  test(
    "MUT-MASTER-DTR-004 — rejects missing dtr name",
    { tag: ["@mutation-proof", "@master-data", "@dtr-master"] },
    async () => {
      const mutated = structuredClone(sampleDtrMasterSuccess);
      delete (mutated.data.rows[0] as Record<string, unknown>).dtr;
      expect(DtrMasterStrictSuccessResponseSchema.safeParse(mutated).success).toBe(
        false,
      );
    },
  );
});

test.describe("Mutation proof — Consumer Master", () => {
  test(
    "MUT-MASTER-CM-001 — accepts fixture",
    { tag: ["@mutation-proof", "@master-data", "@consumer-master"] },
    async () => {
      expectAccepts(
        ConsumerMasterStrictSuccessResponseSchema,
        sampleConsumerMasterSuccess,
      );
    },
  );

  test(
    "MUT-MASTER-CM-002 — rejects success false",
    { tag: ["@mutation-proof", "@master-data", "@consumer-master"] },
    async () => {
      expectRejectsSuccessFalse(
        ConsumerMasterStrictSuccessResponseSchema,
        sampleConsumerMasterSuccess,
      );
    },
  );

  test(
    "MUT-MASTER-CM-003 — rejects unexpected root field",
    { tag: ["@mutation-proof", "@master-data", "@consumer-master"] },
    async () => {
      expectRejectsExtraRoot(
        ConsumerMasterStrictSuccessResponseSchema,
        sampleConsumerMasterSuccess,
      );
    },
  );

  test(
    "MUT-MASTER-CM-004 — DQ flags blank consumerName",
    { tag: ["@mutation-proof", "@master-data", "@consumer-master"] },
    async () => {
      const mutated = structuredClone(sampleConsumerMasterSuccess.data);
      mutated.rows[0].consumerName = "";
      const report = collectMasterDataDataQualityFindings(
        "consumer-master",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );
});

test.describe("Mutation proof — Feeder Master", () => {
  test(
    "MUT-MASTER-FM-001 — accepts fixture",
    { tag: ["@mutation-proof", "@master-data", "@feeder-master"] },
    async () => {
      expectAccepts(FeederMasterStrictSuccessResponseSchema, sampleFeederMasterSuccess);
    },
  );

  test(
    "MUT-MASTER-FM-002 — rejects success false",
    { tag: ["@mutation-proof", "@master-data", "@feeder-master"] },
    async () => {
      expectRejectsSuccessFalse(
        FeederMasterStrictSuccessResponseSchema,
        sampleFeederMasterSuccess,
      );
    },
  );

  test(
    "MUT-MASTER-FM-003 — rejects unexpected root field",
    { tag: ["@mutation-proof", "@master-data", "@feeder-master"] },
    async () => {
      expectRejectsExtraRoot(
        FeederMasterStrictSuccessResponseSchema,
        sampleFeederMasterSuccess,
      );
    },
  );

  test(
    "MUT-MASTER-FM-004 — rejects negative dtrCount",
    { tag: ["@mutation-proof", "@master-data", "@feeder-master"] },
    async () => {
      const mutated = structuredClone(sampleFeederMasterSuccess);
      mutated.data.rows[0].dtrCount = -1;
      expect(
        FeederMasterStrictSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );
});

test.describe("Mutation proof — Substation Master", () => {
  test(
    "MUT-MASTER-SS-001 — accepts fixture",
    { tag: ["@mutation-proof", "@master-data", "@substation-master"] },
    async () => {
      expectAccepts(
        SubstationMasterStrictSuccessResponseSchema,
        sampleSubstationMasterSuccess,
      );
    },
  );

  test(
    "MUT-MASTER-SS-002 — rejects success false",
    { tag: ["@mutation-proof", "@master-data", "@substation-master"] },
    async () => {
      expectRejectsSuccessFalse(
        SubstationMasterStrictSuccessResponseSchema,
        sampleSubstationMasterSuccess,
      );
    },
  );

  test(
    "MUT-MASTER-SS-003 — rejects unexpected root field",
    { tag: ["@mutation-proof", "@master-data", "@substation-master"] },
    async () => {
      expectRejectsExtraRoot(
        SubstationMasterStrictSuccessResponseSchema,
        sampleSubstationMasterSuccess,
      );
    },
  );
});

test.describe("Mutation proof — Meter Communication", () => {
  test(
    "MUT-MASTER-MC-001 — accepts fixture",
    { tag: ["@mutation-proof", "@master-data", "@meter-communication"] },
    async () => {
      expectAccepts(
        MeterCommunicationStrictSuccessResponseSchema,
        sampleMeterCommunicationSuccess,
      );
    },
  );

  test(
    "MUT-MASTER-MC-002 — rejects success false",
    { tag: ["@mutation-proof", "@master-data", "@meter-communication"] },
    async () => {
      expectRejectsSuccessFalse(
        MeterCommunicationStrictSuccessResponseSchema,
        sampleMeterCommunicationSuccess,
      );
    },
  );

  test(
    "MUT-MASTER-MC-003 — rejects unexpected root field",
    { tag: ["@mutation-proof", "@master-data", "@meter-communication"] },
    async () => {
      expectRejectsExtraRoot(
        MeterCommunicationStrictSuccessResponseSchema,
        sampleMeterCommunicationSuccess,
      );
    },
  );

  test(
    "MUT-MASTER-MC-004 — rejects missing communicationStatus",
    { tag: ["@mutation-proof", "@master-data", "@meter-communication"] },
    async () => {
      const mutated = structuredClone(sampleMeterCommunicationSuccess);
      delete (mutated.data.rows[0] as Record<string, unknown>).communicationStatus;
      expect(
        MeterCommunicationStrictSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );
});
