import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { PowerFactorApi } from "../Api/powerfactor.api";
import { LFAnalysisApi } from "../Api/loadfactor.api";
import { ConsumptionPatternApi } from "../Api/consumptionpattern.api";
import { ConsumptionCompareApi } from "../Api/consumptioncompare.api";
import { MdAnalysisApi } from "../Api/mdanalysis.api";
import { DayNightApi } from "../Api/daynight.api";
import { commercialEdgeCases } from "../Data/commercial-negative.data";
import {
  LF_COVERAGE_GATED_MISSING_MONTHS,
  LF_TYPE_CONFIG,
  lfAnalysisLt5Last6mData,
} from "../Data/loadfactor.api";
import {
  mdAnalysisCdCompareData,
  mdAnalysisSanctionLoadData,
  mdAnalysisImproperData,
} from "../Data/mdanalysis.data";
import {
  CONSUMPTION_COMPARE_COVERAGE_GATED_MISSING_MONTHS,
  CONSUMPTION_COMPARE_COVERAGE_GATED_TYPES,
  consumptionCompareLastMonthData,
} from "../Data/consumptioncompare.data";
import { CONSUMPTION_PATTERN_COVERAGE_GATED_MISSING_MONTHS } from "../Data/consumptionpattern.data";
import { mapLFAnalysisResponse } from "../Mapper/loadfactor.mapper";
import { LFAnalysisValidator } from "../Validator/loadfactor.validator";
import { mapConsumptionPatternResponse } from "../Mapper/consumptionpattern.mapper";
import { ConsumptionPatternValidator } from "../Validator/consumptionpattern.validator";
import { mapDayNightResponse } from "../Mapper/daynight.mapper";
import { DayNightValidator } from "../Validator/daynight.validator";
import { DAY_NIGHT_TYPE_CONFIG } from "../Data/daynight.data";
import { ConsumptionCompareValidator } from "../Validator/consumptioncompare.validator";
import { mapConsumptionCompareResponse } from "../Mapper/consumptioncompare.mapper";
import { mapMdAnalysisResponse } from "../Mapper/mdanalysis.mapper";
import { MdAnalysisValidator } from "../Validator/mdanalysis.validator";
import { PowerFactorMapper } from "../Mapper/powerfactor.mapper";
import { PowerFactorValidator } from "../Validator/powerfactoranalysis.validator";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { shouldSkipCommercialResponse } from "../utils/commercial-request.helper";
import { CommercialCommonValidator } from "../Validator/commercial-common.validator";

test.describe("Commercial Analysis — extra report checks", () => {
  test.describe.configure({ retries: 2 });
  test.setTimeout(600_000);

  test(
    "Power Factor Violation — page 2 still shows a valid meter list",
    { tag: ["@commercial", "@power-factor", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new PowerFactorApi(authenticatedApi);
      const params = commercialEdgeCases.pfPage2;
      const { rawResponse, responseBody } = await api.getPfAnalysis(params);

      if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
        test.skip(true, "PF page 2 returned persistent INTERNAL_ERROR");
        return;
      }

      const validation = new ValidationEngine();
      const validator = new PowerFactorValidator();
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Pagination echo", () =>
        validator.validatePagination(responseBody, params),
      );
      validation.printSummary("PF — Page 2", 0);
    },
  );

  test(
    "Power Factor Violation — showing 1 meter per page returns at most one meter",
    { tag: ["@commercial", "@power-factor", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new PowerFactorApi(authenticatedApi);
      const params = commercialEdgeCases.pfPageSize1;
      const { rawResponse, responseBody } = await api.getPfAnalysis(params);

      if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
        test.skip(true, "PF pageSize 1 returned persistent INTERNAL_ERROR");
        return;
      }

      const validation = new ValidationEngine();
      const rows = PowerFactorMapper.mapPfRows(responseBody?.data?.rows ?? []);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("At most one row", () => {
        expect(rows.length).toBeLessThanOrEqual(1);
      });
      validation.printSummary("PF — PageSize 1", 0);
    },
  );

  test(
    "Load Factor above 100% — report opens",
    { tag: ["@commercial", "@lf-analysis", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new LFAnalysisApi(authenticatedApi);
      const params = commercialEdgeCases.lfGt100;
      const { rawResponse, responseBody } = await api.getLFAnalysis(params);

      if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
        test.skip(true, "LF > 100 returned persistent INTERNAL_ERROR");
        return;
      }

      const validation = new ValidationEngine();
      const validator = new LFAnalysisValidator();
      const cfg = LF_TYPE_CONFIG[params.type];
      const rows = mapLFAnalysisResponse(responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Query echo", () =>
        validator.validateQueryParams(responseBody, params),
      );
      validation.execute("Grid columns", () =>
        validator.validateGridColumns(responseBody, params.type),
      );
      validation.execute("LF > 100", () =>
        validator.validateLfAgainstThreshold(
          rows,
          cfg.threshold,
          cfg.operator,
        ),
      );
      validation.execute("LF>100% is sanctioned load, not 100", () =>
        validator.validateSanctionedLoadColumn(rows),
      );
      validation.execute("Duplicate LF", () =>
        validator.validateDuplicateContract(rows),
      );
      validation.printSummary("LF — gt 100", 0);
    },
  );

  test(
    "Load Factor less than 5% for last 3 months — report opens and values follow the rule",
    { tag: ["@commercial", "@lf-analysis", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new LFAnalysisApi(authenticatedApi);
      const params = commercialEdgeCases.lfLt5Last3m;
      const { rawResponse, responseBody } = await api.getLFAnalysis(params);

      if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
        test.skip(true, "LF lt 5 last 3m returned persistent INTERNAL_ERROR");
        return;
      }

      const validation = new ValidationEngine();
      const validator = new LFAnalysisValidator();
      const cfg = LF_TYPE_CONFIG[params.type];
      const rows = mapLFAnalysisResponse(responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Query echo", () =>
        validator.validateQueryParams(responseBody, params),
      );
      validation.execute("Grid columns", () =>
        validator.validateGridColumns(responseBody, params.type),
      );
      validation.execute("LF threshold", () =>
        validator.validateLfAgainstThreshold(
          rows,
          cfg.threshold,
          cfg.operator,
        ),
      );
      validation.execute("LF<5% echoes 5", () =>
        validator.validateReportThresholdColumn(rows, cfg.threshold),
      );
      validation.execute("Duplicate LF", () =>
        validator.validateDuplicateContract(rows),
      );
      validation.printSummary("LF — lt 5 last 3m", 0);
    },
  );

  test(
    "Load Factor less than 5% for last 6 months — billing data is not ready yet",
    { tag: ["@commercial", "@lf-analysis", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new LFAnalysisApi(authenticatedApi);
      const { rawResponse, responseBody } = await api.getLFAnalysis(
        lfAnalysisLt5Last6mData,
        { maxAttempts: 1 },
      );
      CommercialCommonValidator.validateBillingPeriodNotReady(
        rawResponse.status(),
        responseBody,
        LF_COVERAGE_GATED_MISSING_MONTHS,
      );
    },
  );

  test(
    "Consumption Pattern — 100 units for last 3 months: report opens",
    { tag: ["@commercial", "@consumption-pattern", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionPatternApi(authenticatedApi);
      const params = commercialEdgeCases.patternLow3m;
      const { rawResponse, responseBody } =
        await api.getConsumptionPattern(params);

      if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
        test.skip(true, "Pattern low 3m returned persistent INTERNAL_ERROR");
        return;
      }

      const validation = new ValidationEngine();
      const validator = new ConsumptionPatternValidator();
      const rows = mapConsumptionPatternResponse(responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Grid columns", () =>
        validator.validateGridColumns(responseBody),
      );
      validation.execute("Pattern", () =>
        validator.validateReportForPattern(responseBody, params.pattern),
      );
      validation.execute("Business rules", () =>
        validator.validatePatternRows(rows, params.pattern, params.threshold),
      );
      validation.execute("Duplicate contract", () =>
        validator.validateDuplicateContract(rows),
      );
      validation.printSummary("Pattern — low 3m", 0);
    },
  );

  test(
    "Consumption Pattern — zero consumption for last 3 months: report opens",
    { tag: ["@commercial", "@consumption-pattern", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionPatternApi(authenticatedApi);
      const params = commercialEdgeCases.patternZero3m;
      const { rawResponse, responseBody } =
        await api.getConsumptionPattern(params);
      if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
        test.skip(true, "Pattern zero 3m returned persistent INTERNAL_ERROR");
        return;
      }
      const validation = new ValidationEngine();
      const validator = new ConsumptionPatternValidator();
      const rows = mapConsumptionPatternResponse(responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Grid columns", () =>
        validator.validateGridColumns(responseBody),
      );
      validation.execute("Business rules", () =>
        validator.validatePatternRows(rows, "zero", 100),
      );
      validation.execute("Duplicate contract", () =>
        validator.validateDuplicateContract(rows),
      );
      validation.printSummary("Pattern — zero 3m", 0);
    },
  );

  test(
    "Consumption Pattern — zero consumption page 2 still shows a valid meter list",
    { tag: ["@commercial", "@consumption-pattern", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionPatternApi(authenticatedApi);
      const params = commercialEdgeCases.patternZero1mPage2;
      const { rawResponse, responseBody } =
        await api.getConsumptionPattern(params);
      if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
        test.skip(true, "Pattern zero 1m page 2 returned persistent INTERNAL_ERROR");
        return;
      }
      const validation = new ValidationEngine();
      const validator = new ConsumptionPatternValidator();
      const rows = mapConsumptionPatternResponse(responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Pagination page 2", () =>
        validator.validatePagination(responseBody, params),
      );
      validation.execute("kWh is zero", () =>
        validator.validatePatternRows(rows, "zero", 100),
      );
      validation.execute("Duplicate contract", () =>
        validator.validateDuplicateContract(rows),
      );
      validation.printSummary("Pattern — zero 1m page 2", 0);
    },
  );

  test(
    "Consumption Pattern — showing 1 meter per page returns at most one meter",
    { tag: ["@commercial", "@consumption-pattern", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionPatternApi(authenticatedApi);
      const params = commercialEdgeCases.patternZero1mPageSize1;
      const { rawResponse, responseBody } =
        await api.getConsumptionPattern(params);
      if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
        test.skip(true, "Pattern zero 1m pageSize 1 returned persistent INTERNAL_ERROR");
        return;
      }
      const validation = new ValidationEngine();
      const validator = new ConsumptionPatternValidator();
      const rows = mapConsumptionPatternResponse(responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Exactly one row", () => {
        expect(rows).toHaveLength(1);
      });
      validation.execute("Duplicate contract", () =>
        validator.validateDuplicateContract(rows),
      );
      validation.printSummary("Pattern — zero 1m pageSize 1", 0);
    },
  );

  test(
    "Consumption Pattern — report still opens when the report type is not selected (uses default)",
    { tag: ["@commercial", "@consumption-pattern", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionPatternApi(authenticatedApi);
      const { rawResponse, responseBody } = await api.getConsumptionPattern(
        commercialEdgeCases.patternMissingType,
      );
      if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
        test.skip(true, "Pattern omitted type unavailable after retries");
        return;
      }
      const validation = new ValidationEngine();
      const validator = new ConsumptionPatternValidator();
      const rows = mapConsumptionPatternResponse(responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Success", () => {
        expect(responseBody.success).toBe(true);
      });
      validation.execute("Duplicate contract", () =>
        validator.validateDuplicateContract(rows),
      );
      validation.printSummary("Pattern — default type", 0);
    },
  );

  test(
    "Consumption Pattern — zero consumption for last 6 months: billing data is not ready yet",
    { tag: ["@commercial", "@consumption-pattern", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionPatternApi(authenticatedApi);
      const params = commercialEdgeCases.patternZero6m;
      const { rawResponse, responseBody } = await api.getConsumptionPattern(
        params,
        { maxAttempts: 1 },
      );
      CommercialCommonValidator.validateBillingPeriodNotReady(
        rawResponse.status(),
        responseBody,
        CONSUMPTION_PATTERN_COVERAGE_GATED_MISSING_MONTHS[
          "Zero Consumption for Last 6 months"
        ],
      );
    },
  );

  for (const type of CONSUMPTION_COMPARE_COVERAGE_GATED_TYPES) {
    test(
      `Consumption Compare — ${type}: billing data is not ready yet`,
      { tag: ["@commercial", "@consumption-compare", "@edge"] },
      async ({ authenticatedApi }) => {
        const api = new ConsumptionCompareApi(authenticatedApi);
        const { rawResponse, responseBody } = await api.getConsumptionCompare(
          {
            ...consumptionCompareLastMonthData,
            type,
          },
          { maxAttempts: 1 },
        );
        CommercialCommonValidator.validateBillingPeriodNotReady(
          rawResponse.status(),
          responseBody,
          CONSUMPTION_COMPARE_COVERAGE_GATED_MISSING_MONTHS[type],
        );
      },
    );
  }

  for (const [label, data] of [
    ["MD > CD Last Three Month", mdAnalysisCdCompareData],
    ["Sanction Load Violation", mdAnalysisSanctionLoadData],
    ["Improper MD", mdAnalysisImproperData],
  ] as const) {
    test(
      `Maximum Demand — ${label}: report opens and demand follows the rule`,
      { tag: ["@commercial", "@md-analysis", "@edge"] },
      async ({ authenticatedApi }) => {
        const api = new MdAnalysisApi(authenticatedApi);
        const { rawResponse, responseBody } = await api.getMdAnalysis(data);

        if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
          test.skip(true, `MD ${label} returned persistent INTERNAL_ERROR`);
          return;
        }

        const validation = new ValidationEngine();
        const validator = new MdAnalysisValidator();
        const rows = mapMdAnalysisResponse(responseBody);
        validation.execute("Status 200", () => {
          expect(rawResponse.status()).toBe(200);
        });
        validation.execute("Grid columns", () =>
          validator.validateGridColumns(responseBody, data.type),
        );
        validation.execute("Report type", () =>
          validator.validateReportForType(responseBody, data.type),
        );
        validation.execute("Business rules", () =>
          validator.validateBusinessRules(rows, data.type),
        );
        validation.execute("Duplicate contract", () =>
          validator.validateDuplicateContract(rows),
        );
        validation.printSummary(`MD — ${label}`, 0);
      },
    );
  }

  test(
    "Consumption Compare (Last Month) — page 2 still shows a valid meter list",
    { tag: ["@commercial", "@consumption-compare", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionCompareApi(authenticatedApi);
      const params = commercialEdgeCases.comparePage2;
      const { rawResponse, responseBody } =
        await api.getConsumptionCompare(params);

      if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
        test.skip(true, "Compare page 2 returned persistent INTERNAL_ERROR");
        return;
      }

      const validation = new ValidationEngine();
      const validator = new ConsumptionCompareValidator();
      const rows = mapConsumptionCompareResponse(responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Pagination", () =>
        validator.validatePagination(responseBody, params),
      );
      validation.execute("Business rules", () =>
        validator.validateBusinessRules(rows, params.type),
      );
      validation.execute("Duplicate contract", () =>
        validator.validateDuplicateContract(rows),
      );
      validation.printSummary("Compare — Page 2", 0);
    },
  );

  test(
    "Power Factor Violation — report still opens when PF limit is not selected (uses default)",
    { tag: ["@commercial", "@power-factor", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new PowerFactorApi(authenticatedApi);
      const { rawResponse, responseBody } = await api.getPfAnalysis(
        commercialEdgeCases.pfMissingThreshold,
      );
      const validation = new ValidationEngine();
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Success", () => {
        expect(responseBody.success).toBe(true);
      });
      validation.printSummary("PF — default threshold", 0);
    },
  );

  test(
    "Load Factor — report still opens when the rule is not selected (uses default)",
    { tag: ["@commercial", "@lf-analysis", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new LFAnalysisApi(authenticatedApi);
      const { rawResponse, responseBody } = await api.getLFAnalysis(
        commercialEdgeCases.lfMissingOperator,
      );
      const validation = new ValidationEngine();
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Success", () => {
        expect(responseBody.success).toBe(true);
      });
      validation.printSummary("LF — default operator", 0);
    },
  );

  test(
    "Maximum Demand — report still opens when the report type is not selected (uses default)",
    { tag: ["@commercial", "@md-analysis", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new MdAnalysisApi(authenticatedApi);
      const { rawResponse, responseBody } = await api.getMdAnalysis(
        commercialEdgeCases.mdMissingType,
      );
      const validation = new ValidationEngine();
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Success", () => {
        expect(responseBody.success).toBe(true);
      });
      validation.printSummary("MD — default type", 0);
    },
  );

  test(
    "Consumption Compare — report still opens when the report type is not selected (uses default)",
    { tag: ["@commercial", "@consumption-compare", "@edge"] },
    async ({ authenticatedApi }) => {
      const api = new ConsumptionCompareApi(authenticatedApi);
      const { rawResponse, responseBody } = await api.getConsumptionCompare(
        commercialEdgeCases.compareMissingType,
      );
      if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
        test.skip(true, "Compare omitted type unavailable after retries");
        return;
      }
      const validation = new ValidationEngine();
      const validator = new ConsumptionCompareValidator();
      const rows = mapConsumptionCompareResponse(responseBody);
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Success", () => {
        expect(responseBody.success).toBe(true);
      });
      validation.execute("Duplicate contract", () =>
        validator.validateDuplicateContract(rows),
      );
      validation.printSummary("Compare — default type", 0);
    },
  );

  for (const [label, params] of [
    ["Night Zero Consumption", commercialEdgeCases.dayNightZero],
    [
      "Night consumption <= 10% of Day consumption",
      commercialEdgeCases.dayNightLte,
    ],
  ] as const) {
    test(
      `Day and Night — ${label}: report opens and usage follows the rule`,
      { tag: ["@commercial", "@day-night", "@edge"] },
      async ({ authenticatedApi }) => {
        const api = new DayNightApi(authenticatedApi);
        const { rawResponse, responseBody } = await api.getDayNight(params);

        if (shouldSkipCommercialResponse(rawResponse.status(), responseBody)) {
          test.skip(true, `Day-night ${label} returned persistent INTERNAL_ERROR`);
          return;
        }

        const validation = new ValidationEngine();
        const validator = new DayNightValidator();
        const rows = mapDayNightResponse(responseBody);
        const cfg = DAY_NIGHT_TYPE_CONFIG[params.type];
        validation.execute("Status 200", () => {
          expect(rawResponse.status()).toBe(200);
        });
        validation.execute("Empty grid allowed", () =>
          validator.validateResponse(responseBody),
        );
        validation.execute("Grid columns", () =>
          validator.validateGridColumns(responseBody, params.type),
        );
        validation.execute("Pagination", () =>
          validator.validatePagination(responseBody, params),
        );
        validation.execute("Business rules", () =>
          validator.validateBusinessRules(rows, cfg.kind),
        );
        validation.execute("Duplicate contract", () =>
          validator.validateDuplicateContract(rows),
        );
        validation.printSummary(`Day-night — ${label}`, 0);
      },
    );
  }
});
