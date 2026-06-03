import { test } from "../../../fixtures/api.fixture";
import { EventClassificationApi } from "../Api/event-classification.api";
import { EventClassificationMapper } from "../Mapper/event-classification.mapper";
import { EventClassificationValidator } from "../Validator/event-classification.validator";
import { eventClassificationQuery } from "../Data/event-classification.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

test.describe("MIS Event Classification API", () => {
  test(
    "Validate Event Classification",
    {
      tag: ["@smoke", "@classification"]
    },
    async ({ authenticatedApi }) => {
      const api = new EventClassificationApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getEventClassification(eventClassificationQuery);

      const validation = new ValidationEngine();
      const assert = new AssertionEngine();

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: "Event Classification API",
        rawResponse,
        responseBody,
        responseTime,
        maxResponseTimeMs: MIS_SLOW_REQUEST_TIMEOUT_MS
      });

      const data = EventClassificationMapper.map(responseBody.data);
      const validator = new EventClassificationValidator();

      validation.execute("Response", () => validator.validateResponse(responseBody));
      validation.execute("Event Classification", () => validator.validate(data));
      validation.execute("Business Investigation", () =>
        validator.validateBusinessAnomalies(data)
      );

      validation.printSummary("Event Classification API", responseTime);
    }
  );
});
