import { test, expect } from "@playwright/test";
import {
  CommericialAnalysisSuccessResponseSchema,
  CommericialAnalysisListSuccessResponseSchema,
} from "../../schemas/commericial-analysis.schemas";
import { collectCommericialAnalysisDataQualityFindings } from "../../Db/commericial-analysis-db.validator";
import { sampleCommericialAnalysisSuccess } from "./fixtures/commericial-analysis-sample.fixture";
import {
  expectedCommercialPageRecordCount,
  validateCommercialTotalCount,
} from "../../Validator/commercial-analysis.shared";
import { PowerFactorValidator } from "../../Validator/powerfactoranalysis.validator";
import { LFAnalysisValidator } from "../../Validator/loadfactor.validator";
import { MdAnalysisValidator } from "../../Validator/mdanalysis.validator";
import { ConsumptionPatternValidator } from "../../Validator/consumptionpattern.validator";
import { ConsumptionCompareValidator } from "../../Validator/consumptioncompare.validator";
import { DayNightValidator } from "../../Validator/daynight.validator";
import { validateUniqueMeterIdentityFields } from "../../Validator/commercial-analysis.shared";

test.describe("Mutation proof — COMMERICIAL-ANALYSIS", () => {
  test(
    "MUT-COMMER-001 — schema rejects success false",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      const mutated = structuredClone(sampleCommericialAnalysisSuccess);
      (mutated as Record<string, unknown>).success = false;
      expect(CommericialAnalysisSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-COMMER-002 — schema rejects unexpected root field",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      const mutated = structuredClone(sampleCommericialAnalysisSuccess);
      (mutated as Record<string, unknown>).extraField = true;
      expect(CommericialAnalysisSuccessResponseSchema.safeParse(mutated).success).toBe(false);
    },
  );

  test(
    "MUT-COMMER-003 — list schema accepts fixture",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      expect(CommericialAnalysisListSuccessResponseSchema.safeParse(sampleCommericialAnalysisSuccess).success).toBe(
        true,
      );
    },
  );

  test(
    "MUT-COMMER-004 — DQ flags blank name",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      const mutated = structuredClone(sampleCommericialAnalysisSuccess.data);
      mutated.items[0].name = "";
      const report = collectCommericialAnalysisDataQualityFindings(
        "list",
        mutated as unknown as Record<string, unknown>,
      );
      expect(report.warnings.length + report.counts.emptyName).toBeGreaterThan(0);
    },
  );

  test(
    "MUT-COMMER-005 — page records must equal total math (rows.length vs total)",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      expect(expectedCommercialPageRecordCount(8949, 1, 10)).toBe(10);
      expect(expectedCommercialPageRecordCount(8949, 895, 10)).toBe(9);
      expect(expectedCommercialPageRecordCount(5, 1, 100)).toBe(5);

      expect(() =>
        validateCommercialTotalCount(
          {
            rows: Array.from({ length: 9 }, (_, i) => ({ id: i })),
            pagination: { page: 1, limit: 10, total: 8949, totalPages: 895 },
          },
          { month: 12, year: 2025, page: 1, pageSize: 10 },
        ),
      ).toThrow(/records|expected/i);
    },
  );

  test(
    "MUT-COMMER-006 — domestic + non-domestic cannot exceed unfiltered total",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      const validator = new PowerFactorValidator();
      expect(() =>
        validator.validateDomesticNonDomesticTotals({
          allTotal: 100,
          domesticTotal: 60,
          nonDomesticTotal: 50,
        }),
      ).toThrow(/exceed|domestic|non-domestic|unfiltered/i);
    },
  );

  test(
    "MUT-COMMER-007 — LF page records must equal total math",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      expect(expectedCommercialPageRecordCount(226, 1, 10)).toBe(10);
      expect(expectedCommercialPageRecordCount(226, 23, 10)).toBe(6);

      expect(() =>
        validateCommercialTotalCount(
          {
            rows: Array.from({ length: 9 }, (_, i) => ({ id: i })),
            pagination: { page: 1, limit: 10, total: 226, totalPages: 23 },
          },
          { month: 12, year: 2025, page: 1, pageSize: 10 },
        ),
      ).toThrow(/records|expected/i);
    },
  );

  test(
    "MUT-COMMER-008 — LF domestic + non-domestic cannot exceed unfiltered",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      const validator = new LFAnalysisValidator();
      expect(() =>
        validator.validateDomesticNonDomesticTotals({
          allTotal: 400,
          domesticTotal: 226,
          nonDomesticTotal: 252,
        }),
      ).toThrow(/exceed|domestic|non-domestic|unfiltered/i);
    },
  );

  test(
    "MUT-COMMER-008b — same MSN+DTR+LF fails; different DTR is allowed",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      const validator = new LFAnalysisValidator();
      const base = {
        circle: "c",
        division: "d",
        subDivision: "z",
        subStation: "ss",
        feeder: "f",
        dtr: "dtr",
        name: "n",
        tariff: "t",
        phase: "1 PH",
      };
      expect(() =>
        validator.validateUniqueIdentityFields([
          {
            ...base,
            meterLookupId: 1,
            msn: "85000001",
            ivrsNumber: "N1",
            lf: 0.01,
            dtr: "A",
          },
          {
            ...base,
            meterLookupId: 2,
            msn: "85000001",
            ivrsNumber: "N2",
            lf: 0.02,
            dtr: "B",
          },
        ]),
      ).not.toThrow();
      expect(() =>
        validator.validateUniqueIdentityFields([
          {
            ...base,
            meterLookupId: 1,
            msn: "85000001",
            ivrsNumber: "N1",
            lf: 2.43,
            dtr: "AR147",
          },
          {
            ...base,
            meterLookupId: 1,
            msn: "85000001",
            ivrsNumber: "N1",
            lf: 2.43,
            dtr: "AR149",
          },
        ]),
      ).not.toThrow();
      expect(() =>
        validator.validateUniqueIdentityFields([
          {
            ...base,
            meterLookupId: 1,
            msn: "85000001",
            ivrsNumber: "N1",
            lf: 2.43,
            dtr: "AR147",
          },
          {
            ...base,
            meterLookupId: 2,
            msn: "85000001",
            ivrsNumber: "N2",
            lf: 2.43,
            dtr: "AR147",
          },
        ]),
      ).toThrow(/same value/i);
      expect(() =>
        validator.validateDuplicateContract([
          {
            ...base,
            meterLookupId: 1,
            msn: "85000001",
            ivrsNumber: "N1",
            lf: 2.43,
            dtr: "AR147",
          },
          {
            ...base,
            meterLookupId: 1,
            msn: "85000001",
            ivrsNumber: "N1",
            lf: 2.43,
            dtr: "AR147",
          },
        ]),
      ).toThrow(/Duplicate/i);
    },
  );

  test(
    "MUT-COMMER-009 — MD page records must equal total math",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      expect(expectedCommercialPageRecordCount(76700, 1, 10)).toBe(10);
      expect(() =>
        validateCommercialTotalCount(
          {
            rows: Array.from({ length: 9 }, (_, i) => ({ id: i })),
            pagination: { page: 1, limit: 10, total: 76700, totalPages: 7670 },
          },
          { month: 12, year: 2025, page: 1, pageSize: 10 },
        ),
      ).toThrow(/records|expected/i);
    },
  );

  test(
    "MUT-COMMER-010 — parked MD same-MSN rule (same MD fails; different MD allowed)",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      const validator = new MdAnalysisValidator();
      const base = {
        circle: "c",
        division: "d",
        subDivision: "z",
        subStation: "ss",
        feeder: "f",
        dtr: "dtr",
        name: "n",
        tariff: "t",
        phase: "1 PH",
        mdDate: "",
      };
      expect(() =>
        validator.validateUniqueIdentityFields([
          {
            ...base,
            meterLookupId: 1,
            msn: "85080241",
            ivrsNumber: "N1",
            sanctionedLoad: 1,
            md: 3.97,
          },
          {
            ...base,
            meterLookupId: 2,
            msn: "85080241",
            ivrsNumber: "N2",
            sanctionedLoad: 1,
            md: 4.1,
          },
        ]),
      ).not.toThrow();
      expect(() =>
        validator.validateUniqueIdentityFields([
          {
            ...base,
            meterLookupId: 1,
            msn: "85080241",
            ivrsNumber: "N1",
            sanctionedLoad: 1,
            md: 3.97,
          },
          {
            ...base,
            meterLookupId: 2,
            msn: "85080241",
            ivrsNumber: "N2",
            sanctionedLoad: 1,
            md: 3.97,
          },
        ]),
      ).toThrow(/same value/i);

      expect(() =>
        validator.validateUniqueIdentityFields([
          {
            ...base,
            meterLookupId: 10,
            msn: "18139016",
            ivrsNumber: "N3477025933",
            sanctionedLoad: 0,
            md: 0,
            mdDate: "02-01-2004 04:00",
          },
          {
            ...base,
            meterLookupId: 11,
            msn: "18139016",
            ivrsNumber: "N3477025934",
            sanctionedLoad: 0,
            md: 0,
            mdDate: "12-08-2025 19:05",
          },
        ]),
      ).not.toThrow();
      expect(() =>
        validator.validateUniqueIdentityFields([
          {
            ...base,
            meterLookupId: 10,
            msn: "18139016",
            ivrsNumber: "N3477025933",
            sanctionedLoad: 0,
            md: 0,
            mdDate: "02-01-2004 04:00",
          },
          {
            ...base,
            meterLookupId: 11,
            msn: "18139016",
            ivrsNumber: "N3477025934",
            sanctionedLoad: 0,
            md: 0,
            mdDate: "02-01-2004 04:00",
          },
        ]),
      ).toThrow(/same value/i);
    },
  );

  test(
    "MUT-COMMER-011 — MD domestic + non-domestic must equal unfiltered",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      const validator = new MdAnalysisValidator();
      expect(() =>
        validator.validateDomesticNonDomesticTotals({
          allTotal: 58000,
          domesticTotal: 47116,
          nonDomesticTotal: 10884,
        }),
      ).not.toThrow();
      expect(() =>
        validator.validateDomesticNonDomesticTotals({
          allTotal: 1000,
          domesticTotal: 700,
          nonDomesticTotal: 400,
        }),
      ).toThrow(/equal|unfiltered/i);
      expect(() =>
        validator.validateDomesticNonDomesticTotals({
          allTotal: 1000,
          domesticTotal: 600,
          nonDomesticTotal: 300,
        }),
      ).toThrow(/equal|unfiltered/i);
    },
  );

  test(
    "MUT-COMMER-012 — Pattern page records must equal total math (incl. empty)",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      expect(expectedCommercialPageRecordCount(0, 1, 10)).toBe(0);
      expect(expectedCommercialPageRecordCount(2, 1, 10)).toBe(2);
      expect(() =>
        validateCommercialTotalCount(
          {
            rows: [{ id: 1 }],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          },
          { month: 12, year: 2025, page: 1, pageSize: 10 },
        ),
      ).toThrow(/records|expected/i);
    },
  );

  test(
    "MUT-COMMER-013 — Pattern same MSN+DTR+kWh fails; different DTR is allowed",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      const validator = new ConsumptionPatternValidator();
      expect(() =>
        validator.validateUniqueIdentityFields([
          {
            meterLookupId: 1,
            circle: "c",
            division: "d",
            subDivision: "s",
            subStation: "ss",
            feeder: "f",
            dtr: "t",
            name: "n",
            ivrsNumber: "N1",
            tariff: "LV1",
            msn: "A",
            phase: "1 PH",
            kWh: 0,
          },
          {
            meterLookupId: 2,
            circle: "c",
            division: "d",
            subDivision: "s",
            subStation: "ss",
            feeder: "f",
            dtr: "t",
            name: "n",
            ivrsNumber: "N1",
            tariff: "LV1",
            msn: "B",
            phase: "1 PH",
            kWh: 0,
          },
        ]),
      ).toThrow(/ivrs/i);

      expect(() =>
        validator.validateUniqueIdentityFields([
          {
            meterLookupId: 1,
            circle: "c",
            division: "d",
            subDivision: "s",
            subStation: "ss",
            feeder: "f",
            dtr: "RJ6610",
            name: "n",
            ivrsNumber: "N1",
            tariff: "LV1",
            msn: "A",
            phase: "1 PH",
            kWh: 0,
          },
          {
            meterLookupId: 1,
            circle: "c",
            division: "d",
            subDivision: "s",
            subStation: "ss",
            feeder: "f",
            dtr: "RJ6612",
            name: "n",
            ivrsNumber: "N1",
            tariff: "LV1",
            msn: "A",
            phase: "1 PH",
            kWh: 0,
          },
        ]),
      ).not.toThrow();
      expect(() =>
        validator.validateDuplicateContract([
          {
            meterLookupId: 1,
            circle: "c",
            division: "d",
            subDivision: "s",
            subStation: "ss",
            feeder: "f",
            dtr: "t",
            name: "n",
            ivrsNumber: "N1",
            tariff: "LV1",
            msn: "A",
            phase: "1 PH",
            kWh: 0,
          },
          {
            meterLookupId: 1,
            circle: "c",
            division: "d",
            subDivision: "s",
            subStation: "ss",
            feeder: "f",
            dtr: "t",
            name: "n",
            ivrsNumber: "N1",
            tariff: "LV1",
            msn: "A",
            phase: "1 PH",
            kWh: 0,
          },
        ]),
      ).toThrow(/Duplicate/i);

      expect(() => validator.validateUniqueIdentityFields([])).not.toThrow();
      expect(() =>
        validator.validatePatternRows([], "zero", 100),
      ).not.toThrow();
      expect(() =>
        validator.validatePatternRows(
          [
            {
              meterLookupId: 1,
              circle: "c",
              division: "d",
              subDivision: "s",
              subStation: "ss",
              feeder: "f",
              dtr: "t",
              name: "n",
              ivrsNumber: "N1",
              tariff: "LV1",
              msn: "A",
              phase: "1 PH",
              kWh: 5,
            },
          ],
          "zero",
          100,
        ),
      ).toThrow(/non-zero|kWh/i);
    },
  );

  test(
    "MUT-COMMER-014 — Pattern domestic + non-domestic cannot exceed unfiltered",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      const validator = new ConsumptionPatternValidator();
      expect(() =>
        validator.validateDomesticNonDomesticTotals({
          allTotal: 2,
          domesticTotal: 0,
          nonDomesticTotal: 3,
        }),
      ).toThrow(/exceed|domestic|non-domestic|unfiltered/i);

      expect(() =>
        validator.validateDomesticNonDomesticTotals({
          allTotal: 0,
          domesticTotal: 0,
          nonDomesticTotal: 0,
        }),
      ).not.toThrow();
    },
  );

  test(
    "MUT-COMMER-015 — Day-night empty page records equal total math",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      expect(expectedCommercialPageRecordCount(0, 1, 10)).toBe(0);
      expect(() =>
        validateCommercialTotalCount(
          {
            rows: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          },
          { month: 10, year: 2025, page: 1, pageSize: 10 },
        ),
      ).not.toThrow();
      expect(() =>
        validateCommercialTotalCount(
          {
            rows: [{ id: 1 }],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          },
          { month: 10, year: 2025, page: 1, pageSize: 10 },
        ),
      ).toThrow(/records|expected/i);
    },
  );

  test(
    "MUT-COMMER-016 — Day-night empty rows skip identity; night kWh rule fails",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      const validator = new DayNightValidator();
      expect(() => validator.validateUniqueIdentityFields([])).not.toThrow();
      expect(() => validator.validateBusinessRules([], "zero")).not.toThrow();
      expect(() =>
        validator.validateBusinessRules(
          [
            {
              meterLookupId: 1,
              circle: "c",
              division: "d",
              subDivision: "s",
              feeder: "f",
              dtr: "t",
              name: "n",
              ivrsNumber: "N1",
              tariff: "LV1",
              msn: "A",
              phase: "1 PH",
              nightKwh: 20,
              dayKwh: 100,
            },
          ],
          "lte_threshold",
        ),
      ).toThrow(/10%|nightKwh/i);
    },
  );

  test(
    "MUT-COMMER-018 — Day-night same MSN with same metric fails; different values allowed",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      const validator = new DayNightValidator();
      const base = {
        circle: "c",
        division: "d",
        subDivision: "z",
        feeder: "f",
        dtr: "dtr",
        name: "n",
        tariff: "LV1.2",
        phase: "1 PH",
      };
      expect(() =>
        validator.validateUniqueIdentityFields([
          {
            ...base,
            meterLookupId: 1141,
            msn: "85080001",
            ivrsNumber: "N3008011904",
            count: 20,
            dayKwh: 20.66,
          },
          {
            ...base,
            meterLookupId: 1142,
            msn: "85080001",
            ivrsNumber: "N3008011905",
            count: 21,
            dayKwh: 20.66,
          },
        ]),
      ).not.toThrow();
      expect(() =>
        validator.validateUniqueIdentityFields([
          {
            ...base,
            meterLookupId: 1141,
            msn: "85080001",
            ivrsNumber: "N3008011904",
            count: 20,
            dayKwh: 20.66,
          },
          {
            ...base,
            meterLookupId: 1142,
            msn: "85080001",
            ivrsNumber: "N3008011905",
            count: 20,
            dayKwh: 20.66,
          },
        ]),
      ).toThrow(/same value/i);
      expect(() =>
        validator.validateUniqueIdentityFields([
          {
            ...base,
            meterLookupId: 1095,
            msn: "85080223",
            ivrsNumber: "3544019391",
            nightKwh: 0.54,
            dayKwh: 29.05,
          },
          {
            ...base,
            meterLookupId: 1096,
            msn: "85080223",
            ivrsNumber: "3544019392",
            nightKwh: 0.54,
            dayKwh: 29.05,
          },
        ]),
      ).toThrow(/same value/i);
    },
  );
  test("MUT-COMMER-017 — Compare same MSN with same kWh fails; different kWh is allowed",
    { tag: ["@mutation-proof", "@commericial-analysis"] },
    async () => {
      const validator = new ConsumptionCompareValidator();
      const base = {
        circle: "c",
        division: "d",
        subDivision: "z",
        subStation: "ss",
        feeder: "f",
        dtr: "dtr",
        name: "n",
        tariff: "LV1.2",
        phase: "1 PH",
      };
      expect(() =>
        validator.validateUniqueIdentityFields([
          {
            ...base,
            meterLookupId: 1116,
            msn: "85080062",
            ivrsNumber: "N3008012419",
            currKwh: 41.65,
            prevKwh: 109.14,
          },
          {
            ...base,
            meterLookupId: 1117,
            msn: "85080062",
            ivrsNumber: "N3008012420",
            currKwh: 10,
            prevKwh: 109.14,
          },
        ]),
      ).not.toThrow();
      expect(() =>
        validator.validateUniqueIdentityFields([
          {
            ...base,
            meterLookupId: 1116,
            msn: "85080062",
            ivrsNumber: "N3008012419",
            currKwh: 41.65,
            prevKwh: 109.14,
          },
          {
            ...base,
            meterLookupId: 1117,
            msn: "85080062",
            ivrsNumber: "N3008012420",
            currKwh: 41.65,
            prevKwh: 109.14,
          },
        ]),
      ).toThrow(/same value/i);
      expect(() =>
        validator.validateDuplicateContract([
          {
            ...base,
            meterLookupId: 1116,
            msn: "85080062",
            ivrsNumber: "N3008012419",
            currKwh: 41.65,
            prevKwh: 109.14,
          },
          {
            ...base,
            meterLookupId: 1116,
            msn: "85080062",
            ivrsNumber: "N3008012419",
            currKwh: 41.65,
            prevKwh: 109.14,
          },
        ]),
      ).toThrow(/Duplicate/i);
    },
  );
});
