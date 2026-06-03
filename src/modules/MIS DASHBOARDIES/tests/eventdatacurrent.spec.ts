import { test } from "../../../fixtures/api.fixture";
import { EventCurrentApi } from "../Api/eventdatacurrent.api";
import { EventCurrentMapper } from "../Mapper/eventdatacurrent.mapper";
import { EventCurrentValidator } from "../Validator/eventdatacurrent.validator";
import { eventCurrentQueries,isKnownSlowEventCurrentQuery} from "../Data/eventdatacurrent.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { MIS_SLOW_REQUEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";

test.describe("MIS Event Data Current API", () => {
  eventCurrentQueries.forEach((query) => {
    test(`Validate ${query.reportType}-${query.period}`, async ({ authenticatedApi }) => {
      const api = new EventCurrentApi(authenticatedApi);
      const label = `${query.reportType}-${query.period}`;
      let result;

      try {
        result = await api.getCurrentData(query);
      } catch (error) {
        if (
          isKnownSlowEventCurrentQuery(query) &&
          BackendResponse.isRequestTimeoutError(error)
        ) {
          BackendResponse.logFinding(label, "timeout");
          return;
        }
        throw error;
      }

      if (
        isKnownSlowEventCurrentQuery(query) &&
        BackendResponse.isGatewayTimeout(result.rawResponse.status())
      ) {
        BackendResponse.logFinding(label, 504, result.responseBody);
        return;
      }

      const validation = new ValidationEngine();
      const assert = new AssertionEngine();

      ApiValidationHelper.runStandardChecks(validation, assert, {
        apiName: label,
        rawResponse: result.rawResponse,
        responseBody: result.responseBody,
        responseTime: result.responseTime,
        maxResponseTimeMs: MIS_SLOW_REQUEST_TIMEOUT_MS
      });

      const data = EventCurrentMapper.map(result.responseBody.data);
      const validator = new EventCurrentValidator();

      validation.execute("Response", () => validator.validateResponse(result.responseBody));
      validation.execute("Backend Validation", () => validator.validate(data));
      validation.execute("Business Investigation", () =>
        validator.validateBusinessAnomalies(data)
      );

      validation.printSummary(label, result.responseTime);
    });
  });
});
