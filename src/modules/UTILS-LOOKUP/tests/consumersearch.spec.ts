import { test } from "../../../../src/fixtures/api.fixture";
import { SearchConsumerApi } from "../Api/consumersearch.api";
import { SearchConsumerMapper } from "../Mapper/consumersearch.mapper";
import { SearchConsumerValidator } from "../Validator/consumersearch.validator";

import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Search Consumer API", () => {
  test("Validate Search Consumer",
    {
      tag: ["@smoke", "@consumer"],
    },
    async ({ authenticatedApi }) => {
      const api = new SearchConsumerApi(authenticatedApi);
      const {
        rawResponse,
        responseBody,
        responseTime,
      } = await api.SearchConsumers(1, 20);
      await PerformanceTracker.track(
        rawResponse,
        "Consumer Search API",
        `${process.env.BASE_URL}/indore/utils/search/consumers?page=1&limit=20`,
        responseTime
      );
      const assertion = new AssertionEngine();
      const validation = new ValidationEngine();
      // ==========================================
      // API LEVEL VALIDATIONS
      // ==========================================
      validation.execute("Status Code Validation",() => 
        assertion.validateStatusCode(rawResponse, 200)
    );
      validation.execute("Content Type Validation",() => 
        assertion.validateContentType(rawResponse)
      );
      validation.execute("Response Time Validation",() => 
        assertion.validateResponseTime(responseTime, 60000)
      );
      validation.execute("Security Validation",() => 
        assertion.validateSensitiveData(responseBody)
      );
      // ==========================================
      // DATA MAPPING
      // ==========================================
      const data = SearchConsumerMapper.mapData(responseBody.data);
      const validator = new SearchConsumerValidator();
      // ==========================================
      // RESPONSE CONTRACT VALIDATIONS
      // ==========================================
      validation.execute("Response Validation",() => 
        validator.validateResponse(responseBody)
      );
      validation.execute("Items Validation",() => 
        validator.validateItemsExist(data)
      );
      validation.execute("Pagination Validation",() => 
        validator.validatePagination(data)
      );
      // ==========================================
      // FIELD VALIDATIONS
      // ==========================================
      validation.execute("Required Fields Validation",() => 
        validator.validateRequiredFields(data)
      );
      validation.execute("Data Types Validation",() => 
        validator.validateDataTypes(data)
      );
      // =========================================
      // BUSINESS VALIDATIONS
      // ==========================================
      validation.execute("Serial Sequence Validation",() => 
        validator.validateSerialSequence(data)
      );
      validation.execute("Duplicate Meter Serial Validation",() =>
          validator.validateDuplicateMeterSerials(data),
      );
      validation.execute("Mobile Number Format Validation",() => 
        validator.validateMobileNumberFormat(data),
      );
      validation.execute("IVRS Field Validation",() => 
        validator.validateIvrsFields(data),
      );
      // ==========================================
      // SUMMARY
      // ==========================================
      validation.printSummary("Consumer Search API",responseTime);
    }
  );
});