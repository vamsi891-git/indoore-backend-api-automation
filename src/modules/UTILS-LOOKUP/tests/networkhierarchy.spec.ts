import { test } from "../../../../src/fixtures/api.fixture";
import { NetworkApi } from "../Api/networkhierarchy.api";
import { NetworkMapper } from "../Mapper/networkhierarchy.mapper";
import { NetworkValidator } from "../Validator/networkhierarchy.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Network Hierarchy API", () => {
  test("Validate Network Hierarchy",
    {
      tag: ["@smoke", "@network"],
    },
    async ({ authenticatedApi }) => {
      const api = new NetworkApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getNetworkHierarchy();
        await PerformanceTracker.track(
          rawResponse,
          "Network Hierarchy API",
          `${process.env.BASE_URL}/indore/utils/hierarchies/network`,
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
      const data = NetworkMapper.mapData(responseBody.data);
      const validator = new NetworkValidator();
      validation.execute("Response", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Items", () => validator.validateItemsExist(data));
      validation.execute("Fields", () => validator.validateFields(data));
      validation.execute("Duplicates", () =>
        validator.validateDuplicateCodes(data),
      );
      validation.execute("Order", () => validator.validateOrderSequence(data));
      validation.execute("Hierarchy Validation", () =>
        validator.validateExpectedHierarchy(data),
      );
      validation.printSummary("Network Hierarchy API", responseTime);
    },
  );
});
    