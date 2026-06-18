// tests/consumption-pattern.spec.ts

import { test } from "../../../fixtures/api.fixture";
import { ConsumptionPatternApi } from "../Api/consumptionpattern.api";
import { mapConsumptionPatternResponse } from "../Mapper/consumptionpattern.mapper";
import { ConsumptionPatternValidator } from "../Validator/consumptionpattern.validator";
import { consumptionPatternData } from "../Data/consumptionpattern.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
test.describe("Consumption Pattern API", () => {
  test.setTimeout(120000);

  test("Validate Consumption Pattern Report",
    {
      tag: ["@smoke", "@consumption-pattern"],
    },
    async ({ authenticatedApi }, testInfo) => {
      // =====================
      // API
      // =====================
      const api = new ConsumptionPatternApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getConsumptionPattern(consumptionPatternData);
      const defectContext = {
        module: "COMMERICIAL ANALYSIS",
        endpoint: "/indore/analysis/commercial/consumption-pattern",
        requestParams: consumptionPatternData,
        responseStatus: rawResponse.status(),
        responseBody,
        expectedBehavior:
          "pattern 'zero': all billing rows in window have kWh=0. pattern 'low': SUM(kWh) < threshold.",
      };
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      try {
      validation.execute("Status Code Validation", () =>
        assert.validateStatusCode(rawResponse, 200),
      );

      validation.execute("Content Type Validation", () =>
        assert.validateContentType(rawResponse, "application/json"),
      );

      validation.execute("Response Time Validation", () =>
        assert.validateResponseTime(responseTime, 120000),
      );

      validation.execute("Sensitive Data Validation", () =>
        assert.validateSensitiveData(responseBody),
      );
      // =====================
      // Mapper
      // =====================

      const rows = mapConsumptionPatternResponse(responseBody);
      // =====================
      // Validator
      // =====================
      const validator = new ConsumptionPatternValidator();

      validation.execute("Response Validation", () =>
        validator.validateResponse(responseBody),
      );

      validation.execute("Query Params Validation", () =>
        validator.validateQueryParams(responseBody, consumptionPatternData),
      );

      validation.execute("Report Pattern Validation", () =>
        validator.validateReportForPattern(responseBody,consumptionPatternData.pattern,),
      );
      validation.execute("Mandatory Fields Validation", () =>
        validator.validateMandatoryFields(rows),
      );
      validation.execute("Pattern Business Validation", () =>
        validator.validatePatternRows(rows,consumptionPatternData.pattern,consumptionPatternData.threshold,),
      );
      validation.execute("Duplicate Consumer Validation", () =>
        validator.validateNoDuplicateConsumer(rows),
      );
      validation.execute("Pagination Validation", () =>
        validator.validatePagination(responseBody, consumptionPatternData),
      );
      validation.execute("Total Count Validation", () =>
        validator.validateTotalCount(responseBody, consumptionPatternData),
      );
      } finally {
        ApiValidationHelper.finalize(validation, {
          apiName: "Consumption Pattern API",
          responseTime,
          testInfo,
          defectContext,
        });
      }
    },
  );
});
