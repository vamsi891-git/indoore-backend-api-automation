import { test } from "../../../fixtures/api.fixture";
import { DtrCommunicationApi } from "../Api/dtrcommunication.api";
import { DtrCommunicationMapper } from "../Mapper/dtrcommunication.mapper";
import { DtrCommunicationValidator } from "../Validator/dtrcommunication.validator";
import { dtrCommunicationQuery } from "../Data/dtrcommunication.data";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("DTR talking to the system", () => {
  test(
    "DTR talking to the system — communicating vs not, by day",
    {
      tag: ["@smoke", "@dtr-communication"],
    },
    async ({ authenticatedApi }) => {
      const api = new DtrCommunicationApi(authenticatedApi);
      const { rawResponse, responseBody, responseTime } =
        await api.getDtrCommunicationStatus(dtrCommunicationQuery);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new DtrCommunicationValidator();

      try {
        validation.execute("Status Validation", () =>
          assert.validateStatusCode(rawResponse, 200, responseBody),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse, "application/json"),
        );
        validation.execute("Response Time", () => assert.validateResponseTime(responseTime, 30000));
        validation.execute("Security Validation", () => assert.validateSensitiveData(responseBody));

        if (rawResponse.status() === 200) {
          validation.execute("Response Validation", () => validator.validateResponse(responseBody));

          const data = DtrCommunicationMapper.mapData(responseBody);

          validation.execute("Period", () => validator.validatePeriod(data));
          validation.execute("Point Count", () => validator.validatePointCount(data));
          validation.execute("Points Validation", () => validator.validatePoints(data));
          validation.execute("Unique Labels", () => validator.validateUniqueLabels(data));
          validation.execute("Totals Validation", () => validator.validateTotals(data));
          validation.execute("Communication Status", () =>
            validator.validateCommunicationStatus(data),
          );
        }
      } finally {
        validation.finalize("DTR talking to the system", responseTime);
      }
    },
  );
});
