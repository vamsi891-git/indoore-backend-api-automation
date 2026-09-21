import { test } from "../../../../src/fixtures/api.fixture";
import { PerformanceTracker } from "../../../../src/core/utils/performance.tracker";
import { NotificationsApi } from "../Api/notifications.api";
import { NotificationsMobileData } from "../Data/notificationsmobile.data";
import { NotificationsMobileMapper } from "../Mapper/notificationsmobile.mapper";
import { NotificationsMobileValidator } from "../Validator/notificationsmobile.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

test.describe("Mobile Notification Send API", () => {
  test(
    "Validate Mobile Notification Send API",
    {
      tag: ["@smoke", "@notifications", "@mobile"],
    },
    async ({ authenticatedApi }) => {
      const api = new NotificationsApi(authenticatedApi);
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();
      const validator = new NotificationsMobileValidator();

      const { consumerCid, notificationType, message } = NotificationsMobileData;

      const { rawResponse, responseBody, responseTime } = await api.sendMobileNotification(
        consumerCid,
        notificationType,
        message,
      );

      await PerformanceTracker.track(
        rawResponse,
        "Mobile Notification Send API",
        rawResponse.url(),
        responseTime,
      );

      validation.execute("Status Code", () => assert.validateStatusCode(rawResponse, 200));
      validation.execute("Content Type", () => assert.validateContentType(rawResponse));
      validation.execute("Response Time", () =>
        assert.validateResponseTime(responseTime, NotificationsMobileData.maxResponseTime),
      );
      validation.execute("Sensitive Data", () => assert.validateSensitiveData(responseBody));

      const mapped = NotificationsMobileMapper.map(responseBody);

      validation.execute("Success", () => validator.validateSuccess(mapped));
      validation.execute("Message", () => validator.validateMessage(mapped));
      validation.execute("Structure", () => validator.validateStructure(mapped));
      validation.execute("Request Echo", () =>
        validator.validateRequestEcho(mapped.data, consumerCid, notificationType),
      );
      validation.execute("Notification Type", () =>
        validator.validateNotificationType(mapped.data),
      );
      validation.execute("Recipient Counts", () => validator.validateRecipientCounts(mapped.data));
      validation.execute("Invalid Mobiles", () => validator.validateInvalidMobiles(mapped.data));
      validation.execute("Dispatch Status", () => validator.validateDispatchStatus(mapped.data));
      validation.execute("Dispatch Mode", () => validator.validateDispatchMode(mapped.data));
      validation.execute("Failed Batches", () => validator.validateFailedBatches(mapped.data));

      validation.printSummary("Mobile Notification Send API", responseTime);
    },
  );
});
