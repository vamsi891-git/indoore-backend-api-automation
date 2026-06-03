import { test } from "../../../../src/fixtures/api.fixture";
import { DtrSearchApi } from "../Api/dtrsearch.api";
import { DtrSearchMapper } from "../Mapper/dtrsearch.mapper";
import { DtrSearchValidator } from "../Validator/dtrsearch.validator";

import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("DTR Search API", () => {

  test(
    "Validate DTR Search API",
    {
      tag: ["@smoke", "@dtr"],
    },
    async ({ authenticatedApi }) => {

      const api =
        new DtrSearchApi(authenticatedApi);

      const {
        rawResponse,
        responseBody,
        responseTime,
      } =
        await api.getDtrSearch();

      await PerformanceTracker.track(
        rawResponse,
        "DTR Search API",
        `${process.env.BASE_URL}/indore/utils/search/dtr?page=1&limit=20`,
        responseTime
      );

      const assertion =
        new AssertionEngine();

      const validation =
        new ValidationEngine();

      validation.execute(
        "Status Validation",
        () =>
          assertion.validateStatusCode(
            rawResponse,
            200
          )
      );

      validation.execute(
        "Content Validation",
        () =>
          assertion.validateContentType(
            rawResponse
          )
      );

      validation.execute(
        "Response Time Validation",
        () =>
          assertion.validateResponseTime(
            responseTime,
            60000
          )
      );

      validation.execute(
        "Security Validation",
        () =>
          assertion.validateSensitiveData(
            responseBody
          )
      );

      const data =
        DtrSearchMapper.mapData(
          responseBody.data
        );

      const validator =
        new DtrSearchValidator();

      validation.execute(
        "Response Validation",
        () =>
          validator.validateResponse(
            responseBody
          )
      );

      validation.execute(
        "Pagination Validation",
        () =>
          validator.validatePagination(
            data
          )
      );

      validation.execute(
        "Items Validation",
        () =>
          validator.validateItemsExist(
            data
          )
      );

      validation.execute(
        "Serial Validation",
        () =>
          validator.validateSerialNumbers(
            data
          )
      );

      validation.execute(
        "Required Fields Validation",
        () =>
          validator.validateRequiredFields(
            data
          )
      );

      validation.execute(
        "Data Type Validation",
        () =>
          validator.validateDataTypes(
            data
          )
      );

      validation.execute(
        "Meter Serial Validation",
        () =>
          validator.validateMeterSerialNumbers(
            data
          )
      );

      validation.execute(
        "Duplicate Meter Validation",
        () =>
          validator.validateDuplicateMeterSerials(
            data
          )
      );

      validation.execute(
        "Coordinate Validation",
        () =>
          validator.validateCoordinates(
            data
          )
      );

      validation.execute(
        "MF Validation",
        () =>
          validator.validateMF(
            data
          )
      );

      validation.execute(
        "Business Validation",
        () =>
          validator.validateBusinessRules(
            data
          )
      );

      validation.execute(
        "Aggregation Validation",
        () =>
          validator.validatePageAggregation(
            data
          )
      );

      validation.printSummary(
        "DTR Search API",
        responseTime
      );
    },
  );
});