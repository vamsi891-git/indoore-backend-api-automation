import { test, expect } from "@playwright/test";
import {
  DashboardSummarySuccessResponseSchema,
  ProgressSuccessResponseSchema,
  ConsumerSearchSuccessResponseSchema,
  ConsumerDetailSuccessResponseSchema,
  MeterValidationSuccessResponseSchema,
  SubmissionHistorySuccessResponseSchema,
  SubmissionDetailSuccessResponseSchema,
  CreateSubmissionSuccessResponseSchema,
  BulkValidateMeterReplacementSuccessResponseSchema,
} from "../../schemas/meter-replacement.schemas";
import { collectMeterReplacementDataQualityFindings } from "../../Db/meter-replacement-db.validator";
import {
  sampleDashboardSummarySuccess,
  sampleProgressSuccess,
  sampleConsumerSearchSuccess,
  sampleConsumerDetailSuccess,
  sampleMeterValidationSuccess,
  sampleSubmissionHistorySuccess,
  sampleSubmissionDetailSuccess,
  sampleCreateSubmissionSuccess,
  sampleBulkValidateSuccess,
} from "./fixtures/meter-replacement-sample.fixture";

test.describe("Mutation proof — Dashboard Summary", () => {
  test(
    "MUT-MR-DS-001 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleDashboardSummarySuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        DashboardSummarySuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-MR-DS-002 — schema rejects success false",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleDashboardSummarySuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(
        DashboardSummarySuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );
});

test.describe("Mutation proof — Progress", () => {
  test(
    "MUT-MR-PR-001 — schema rejects missing weekly",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleProgressSuccess);
      delete (mutated.data as Record<string, unknown>).weekly;
      expect(ProgressSuccessResponseSchema.safeParse(mutated).success).toBe(
        false,
      );
    },
  );

  test(
    "MUT-MR-PR-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleProgressSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(ProgressSuccessResponseSchema.safeParse(mutated).success).toBe(
        false,
      );
    },
  );
});

test.describe("Mutation proof — Consumer Search", () => {
  test(
    "MUT-MR-CS-001 — schema rejects non-positive consumerId",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleConsumerSearchSuccess);
      mutated.data[0].consumerId = 0;
      expect(
        ConsumerSearchSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-MR-CS-002 — data-quality flags blank consumerName",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleConsumerSearchSuccess.data);
      mutated[0].consumerName = "";
      const report = collectMeterReplacementDataQualityFindings(
        "consumer-search",
        mutated as unknown as Record<string, unknown>,
      );
      expect(
        report.warnings.length + report.counts.emptyConsumerName,
      ).toBeGreaterThan(0);
    },
  );
});

test.describe("Mutation proof — Consumer Detail", () => {
  test(
    "MUT-MR-CD-001 — schema rejects missing consumerId",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleConsumerDetailSuccess);
      delete (mutated.data as Record<string, unknown>).consumerId;
      expect(
        ConsumerDetailSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-MR-CD-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleConsumerDetailSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        ConsumerDetailSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-MR-CD-003 — data-quality flags blank oldMeterSerial",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleConsumerDetailSuccess.data);
      mutated.oldMeterSerial = "";
      const report = collectMeterReplacementDataQualityFindings(
        "consumer-detail",
        mutated,
      );
      expect(
        report.warnings.length + report.counts.emptyMeterSerial,
      ).toBeGreaterThan(0);
    },
  );
});

test.describe("Mutation proof — Meter Validation", () => {
  test(
    "MUT-MR-MV-001 — schema rejects missing valid flag",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleMeterValidationSuccess);
      delete (mutated.data as Record<string, unknown>).valid;
      expect(
        MeterValidationSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-MR-MV-002 — data-quality flags blank meterSerial",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleMeterValidationSuccess.data);
      mutated.meterSerial = "";
      const report = collectMeterReplacementDataQualityFindings(
        "meter-validation",
        mutated,
      );
      expect(
        report.warnings.length + report.counts.emptyMeterSerial,
      ).toBeGreaterThan(0);
    },
  );
});

test.describe("Mutation proof — Submission History", () => {
  test(
    "MUT-MR-SH-001 — schema rejects invalid status",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleSubmissionHistorySuccess);
      (mutated.data.items[0] as { status: string }).status = "UNKNOWN";
      expect(
        SubmissionHistorySuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-MR-SH-002 — data-quality flags blank oldMeterSerial",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleSubmissionHistorySuccess.data);
      mutated.items[0].oldMeterSerial = "";
      const report = collectMeterReplacementDataQualityFindings(
        "submission-history",
        mutated as unknown as Record<string, unknown>,
      );
      expect(
        report.warnings.length + report.counts.emptyMeterSerial,
      ).toBeGreaterThan(0);
    },
  );
});

test.describe("Mutation proof — Submission Detail", () => {
  test(
    "MUT-MR-SD-001 — schema rejects missing consumer block",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleSubmissionDetailSuccess);
      delete (mutated.data as Record<string, unknown>).consumer;
      expect(
        SubmissionDetailSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-MR-SD-002 — data-quality flags blank consumerName",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleSubmissionDetailSuccess.data);
      mutated.consumer.consumerName = "";
      const report = collectMeterReplacementDataQualityFindings(
        "submission-detail",
        mutated as unknown as Record<string, unknown>,
      );
      expect(
        report.warnings.length + report.counts.emptyConsumerName,
      ).toBeGreaterThan(0);
    },
  );
});

test.describe("Mutation proof — Create Submission", () => {
  test(
    "MUT-MR-CR-001 — schema rejects non-positive id",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleCreateSubmissionSuccess);
      mutated.data.id = 0;
      expect(
        CreateSubmissionSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );

  test(
    "MUT-MR-CR-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleCreateSubmissionSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(
        CreateSubmissionSuccessResponseSchema.safeParse(mutated).success,
      ).toBe(false);
    },
  );
});

test.describe("Mutation proof — Bulk Validate", () => {
  test(
    "MUT-MR-BV-001 — schema rejects missing summary",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleBulkValidateSuccess);
      delete (mutated as { summary?: unknown }).summary;
      expect(
        BulkValidateMeterReplacementSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );

  test(
    "MUT-MR-BV-002 — schema rejects negative totalRows",
    { tag: ["@mutation-proof", "@meter-replacement"] },
    async () => {
      const mutated = structuredClone(sampleBulkValidateSuccess);
      mutated.summary.totalRows = -1;
      expect(
        BulkValidateMeterReplacementSuccessResponseSchema.safeParse(mutated)
          .success,
      ).toBe(false);
    },
  );
});
