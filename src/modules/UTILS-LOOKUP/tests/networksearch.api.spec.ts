// tests/networksearch.spec.ts
import { test } from "../../../../src/fixtures/api.fixture";
import { NetworkSearchApi } from "../Api/networksearch.api";
import { NetworkSearchMapper } from "../Mapper/networksearch.mapper";
import { NetworkSearchValidator } from "../Validator/networksearch.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Network Search API", () => {
  test("Validate Network Search",
    {
      tag: ["@smoke", "@network"],
    },
    async ({ authenticatedApi }) => {
      const api = new NetworkSearchApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.searchNetworks(20);
        await PerformanceTracker.track(
          rawResponse,
          "Network Search API",
          `${process.env.BASE_URL}/indore/utils/search/networks?limit=20`,
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
      const data = NetworkSearchMapper.mapData(responseBody.data);
      const validator = new NetworkSearchValidator();
      validation.execute("Response", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Items", () => validator.validateItemsExist(data));
      validation.execute("Fields", () => validator.validateFields(data));
      validation.execute("Duplicate IDs", () =>
        validator.validateDuplicateIds(data),
      );
      validation.execute("Backend Rules", () =>
        validator.validateBackendRules(data),
      );
      validation.execute("Code Rules", () => validator.validateCodeRules(data));
      validation.printSummary("Network Search API", responseTime);
    },
  );
});
