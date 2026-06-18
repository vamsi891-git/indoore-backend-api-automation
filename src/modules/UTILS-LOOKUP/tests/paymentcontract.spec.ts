// tests/paymentcontract.spec.ts
import { test } from "../../../../src/fixtures/api.fixture";
import { PaymentContractApi } from "../Api/paymentcontract.api";
import { PaymentContractMapper } from "../Mapper/paymentcontract.mapper";
import { PaymentContractValidator } from "../Validator/paymentcontract.validator";

import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Payment Contract API", () => {
  test("Validate Payment Contract API",
    {
      tag: ["@smoke", "@payment"],
    },
    async ({ authenticatedApi }) => {
      const api = new PaymentContractApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getPaymentContracts();
        await PerformanceTracker.track(
          rawResponse,
          "Payment Contract API",
          `${process.env.BASE_URL}/indore/utils/payment-contracts`,
          responseTime
        );
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      validation.execute("Status Validation", () =>
        assert.validateStatusCode(rawResponse, 200),
      );
      validation.execute("Content Validation", () =>
        assert.validateContentType(rawResponse),
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, 60000),
      );
      validation.execute("Security Validation", () =>
        assert.validateSensitiveData(responseBody),
      );
      const data = PaymentContractMapper.mapData(responseBody.data);
      const validator = new PaymentContractValidator();
      validation.execute("Response", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Items", () => validator.validateItemsExist(data));
      validation.execute("Fields", () => validator.validateFields(data));
      validation.execute("Duplicate IDs", () =>
        validator.validateDuplicateIds(data),
      );
      validation.execute("Duplicate Names", () =>
        validator.validateDuplicateNames(data),
      );
      validation.execute("Duplicate Codes", () =>
        validator.validateDuplicateCodes(data),
      );
      validation.execute("Backend Rules", () =>
        validator.validateBackendRules(data),
      );
      validation.execute("Expected Values", () =>
        validator.validateExpectedValues(data),
      );
      validation.printSummary("Payment Contract API", responseTime);
    },
  );
});
