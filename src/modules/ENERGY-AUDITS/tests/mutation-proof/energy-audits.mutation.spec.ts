import { test, expect } from "@playwright/test";
import {
  EnergyAuditsListSuccessResponseSchema,
  EnergyAuditsSuccessResponseSchema,
  HourlyLossReportSuccessResponseSchema,
  LossAnalysisStatsSuccessResponseSchema,
  LossAnalysisSuccessResponseSchema,
  LossAnalysisTrendsSuccessResponseSchema,
  NetworkTrendsSuccessResponseSchema,
} from "../../schemas/energy-audits.schemas";
import { collectEnergyAuditsDataQualityFindings } from "../../Db/energy-audits-db.validator";
import { HourlyLossReportValidator } from "../../Validator/hourly-loss-report.validator";
import { LossAnalysisValidator } from "../../Validator/loss-analysis.validator";
import { captureThrownMessage } from "./fixtures/capture-throw";
import {
  sampleEnergyAuditsSuccess,
  sampleHourlyLossSuccess,
  sampleLossAnalysisStatsSuccess,
  sampleLossAnalysisSuccess,
  sampleLossAnalysisTrendsSuccess,
  sampleNetworkTrendsBillingSuccess,
} from "./fixtures/energy-audits-sample.fixture";

test.describe("Mutation proof — ENERGY-AUDITS", () => {
  test(
    "MUT-ENERGY-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@energy-audits"] },
    async () => {
      const mutated = structuredClone(sampleEnergyAuditsSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(EnergyAuditsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-ENERGY-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@energy-audits"] },
    async () => {
      const mutated = structuredClone(sampleEnergyAuditsSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(EnergyAuditsSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-ENERGY-003 — list schema accepts fixture",
    { tag: ["@mutation-proof", "@energy-audits"] },
    async () => {
      expect(EnergyAuditsListSuccessResponseSchema.safeParse(sampleEnergyAuditsSuccess).success).toBe(
        true,
      );
    },
  );

  test(
    "MUT-ENERGY-004 — DQ flags blank name",
    { tag: ["@mutation-proof", "@energy-audits"] },
    async () => {
      const mutated = structuredClone(sampleEnergyAuditsSuccess.data);
      mutated.items[0].name = "";
      const report = collectEnergyAuditsDataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );

  test(
    "MUT-EA-LA-001 — loss analysis schema fails when inputUnits is removed",
    { tag: ["@mutation-proof", "@energy-audits", "@loss-analysis"] },
    async () => {
      const mutated = structuredClone(sampleLossAnalysisSuccess);
      delete (mutated.data.rows[0] as Record<string, unknown>).inputUnits;
      const result = LossAnalysisSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
    },
  );

  test(
    "MUT-EA-LA-002 — duplicate meter ids fail",
    { tag: ["@mutation-proof", "@energy-audits", "@loss-analysis"] },
    async () => {
      const rows = [
        structuredClone(sampleLossAnalysisSuccess.data.rows[0]),
        structuredClone(sampleLossAnalysisSuccess.data.rows[0]),
      ];
      const message = captureThrownMessage(() =>
        new LossAnalysisValidator().validateNoDuplicateIds(rows, "dtr"),
      );
      expect(message).not.toEqual("");
    },
  );

  test(
    "MUT-EA-HL-001 — hourly schema fails when rowKind is blank",
    { tag: ["@mutation-proof", "@energy-audits", "@hourly-loss-report"] },
    async () => {
      const mutated = structuredClone(sampleHourlyLossSuccess);
      mutated.data.rows[0].rowKind = "   ";
      const result = HourlyLossReportSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
    },
  );

  test(
    "MUT-EA-HL-002 — duplicate hourly row ids fail",
    { tag: ["@mutation-proof", "@energy-audits", "@hourly-loss-report"] },
    async () => {
      const rows = structuredClone(sampleHourlyLossSuccess.data.rows);
      rows[1].id = rows[0].id;
      const message = captureThrownMessage(() =>
        new HourlyLossReportValidator().validateNoDuplicateRowIds(rows as never),
      );
      expect(message).not.toEqual("");
    },
  );

  test(
    "MUT-EA-ST-001 — stats schema fails when totalLoss is removed",
    { tag: ["@mutation-proof", "@energy-audits", "@loss-analysis-stats"] },
    async () => {
      const mutated = structuredClone(sampleLossAnalysisStatsSuccess);
      delete (mutated.data as Record<string, unknown>).totalLoss;
      expect(LossAnalysisStatsSuccessResponseSchema.safeParse(mutated).success).toBe(
        false,
      );
    },
  );

  test(
    "MUT-EA-TR-001 — trends schema fails when items is empty object",
    { tag: ["@mutation-proof", "@energy-audits", "@loss-analysis-trends"] },
    async () => {
      const mutated = structuredClone(sampleLossAnalysisTrendsSuccess);
      (mutated.data as Record<string, unknown>).items = {};
      expect(LossAnalysisTrendsSuccessResponseSchema.safeParse(mutated).success).toBe(
        false,
      );
    },
  );

  test(
    "MUT-EA-NT-001 — network trends schema fails when reportType is invalid",
    { tag: ["@mutation-proof", "@energy-audits", "@network-trends"] },
    async () => {
      const mutated = structuredClone(sampleNetworkTrendsBillingSuccess);
      (mutated.data as Record<string, unknown>).reportType = "foo";
      expect(NetworkTrendsSuccessResponseSchema.safeParse(mutated).success).toBe(
        false,
      );
    },
  );
});
