import { test } from "../../../../src/fixtures/api.fixture";
import { ConsumerMasterApi } from "../Api/consumer-master.api";
import { ConsumerMasterMapper } from "../Mapper/consumer-master.mapper";
import { ConsumerMasterValidator } from "../Validator/consumer-master.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
test.describe("Consumer Master API", () => {
  test(
    "Validate Consumer Master API",
    {
      tag: ["@smoke", "@consumer-master"],
    },
    async ({ authenticatedApi }) => {
      const api = new ConsumerMasterApi(authenticatedApi);
      const {
        rawResponse,
        responseBody,
        responseTime,
      } = await api.getConsumerMasterData();
      await PerformanceTracker.track(
        rawResponse,
        "Consumer Master API",
        `${process.env.BASE_URL}/indore/master-data/consumer-master-data?page=1&limit=20`,
        responseTime
      );
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      validation.execute(
        "Status Validation",
        () => assert.validateStatusCode(rawResponse, 200),
      );
      validation.execute(
        "Content Validation",
        () => assert.validateContentType(rawResponse),
      );
      validation.execute(
        "Response Time",
        () =>
          assert.validateResponseTime(
            responseTime,
            60000,
          ),
      );
      validation.execute(
        "Security Validation",
        () => assert.validateSensitiveData(responseBody),
      );
      const data = ConsumerMasterMapper.mapData(responseBody.data);
      const validator = new ConsumerMasterValidator();
      validation.execute(
        "Response",
        () => validator.validateResponse(responseBody),
      );
      validation.execute(
        "Items",
        () => validator.validateItemsExist(data),
      );
      validation.execute(
        "Fields",
        () => validator.validateFields(data),
      );
      validation.execute(
        "Duplicate Consumer RefId",
        () => validator.validateDuplicateConsumerIds(data),
      );
      validation.execute(
        "Pagination Validation",
        () => validator.validatePagination(data),
      );
      validation.execute(
        "Meter Phase Validation",
        () => validator.validateMeterPhases(data),
      );
      validation.execute(
        "Hierarchy Validation",
        () => validator.validateHierarchyFields(data),
      );
      validation.printSummary(
        "Consumer Master API",
        responseTime,
      );
    },
  );
});
