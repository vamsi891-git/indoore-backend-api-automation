import { test } from "../../../../src/fixtures/api.fixture";
import { DtrMasterApi } from "../Api/dtr-master.api";
import { DtrMasterMapper } from "../Mapper/dtr-master.mapper";
import { DtrMasterValidator } from "../Validator/dtr-master.validator";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("DTR Master API", () => {
  test(
    "Validate DTR Master API",
    {
      tag: ["@smoke", "@dtr"],
    },
    async ({ authenticatedApi }) => {
      const api = new DtrMasterApi(authenticatedApi);
      const {
        rawResponse,
        responseBody,
        responseTime,
      } = await api.getDtrMasterData();
      await PerformanceTracker.track(
        rawResponse,
        "DTR Master API",
        `${process.env.BASE_URL}/indore/master-data/dtr-master-data?page=1&limit=20`,
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
        () => assert.validateResponseTime(responseTime, 60000),
      );
      validation.execute(
        "Security Validation",
        () => assert.validateSensitiveData(responseBody),
      );
      const data = DtrMasterMapper.mapData(responseBody.data);
      const validator = new DtrMasterValidator();
      validation.execute("Response", () =>
        validator.validateResponse(responseBody),
      );
      validation.execute("Items", () => validator.validateItemsExist(data));
      validation.execute("Fields", () => validator.validateFields(data));
      validation.execute("Pagination", () =>
        validator.validatePagination(data),
      );
      validation.execute("Duplicate DTR Names", () =>
        validator.validateDuplicateDtrNames(data),
      );
      validation.execute("Unique Meter Serials", () =>
        validator.validateUniqueMeterSerials(data),
      );
      validation.execute("Ascending Order", () =>
        validator.validateAscendingOrder(data),
      );
      validation.execute("Coordinates Validation", () =>
        validator.validateCoordinates(data),
      );

      validation.printSummary("DTR Master API", responseTime);
    },
  );
});
