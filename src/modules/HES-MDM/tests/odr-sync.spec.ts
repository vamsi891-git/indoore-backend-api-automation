import { expect } from "@playwright/test";
import { test, isHesConfigured } from "../../../fixtures/hes.fixture";
import { OnDemandProfileApi } from "../Api/ondemandprofile.api";
import { odrSyncData } from "../Data/odr.data";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe("HES ODR Sync API", () => {
  test.beforeEach(() => {
    test.skip(!isHesConfigured(), "HES_BASE_URL not configured");
  });

  test(
    "valid meter sync ODR",
    { tag: ["@hes", "@odr", "@sync", "@smoke", "@phase1"] },
    async ({ hesApi }) => {
      const api = new OnDemandProfileApi(hesApi);
      const validation = new ValidationEngine();
      const assert = new AssertionEngine();

      const result = await api.readProfile(odrSyncData.meterId, {
        formattedProfileObisCode: process.env.HES_ODR_OBIS_CODE ?? "1.0.99.1.0.255",
        sampleStartTime: odrSyncData.sampleStartTime,
        sampleStopTime: odrSyncData.sampleStopTime
      });

      validation.execute("Status", () =>
        assert.validateStatusCode(result.rawResponse, 200, result.responseBody)
      );
      validation.execute("Content Type", () =>
        assert.validateContentType(result.rawResponse, "application/json")
      );
      validation.execute("Response Time", () =>
        assert.validateResponseTime(result.responseTime, 120_000)
      );

      validation.printSummary("ODR Sync — valid meter", result.responseTime);
    }
  );

  test(
    "negative — invalid meterId",
    { tag: ["@hes", "@odr", "@sync", "@negative", "@phase1"] },
    async ({ hesApi }) => {
      const api = new OnDemandProfileApi(hesApi);
      const result = await api.readProfile(odrSyncData.invalidMeterId, {
        formattedProfileObisCode: process.env.HES_ODR_OBIS_CODE ?? "1.0.99.1.0.255",
        sampleStartTime: odrSyncData.sampleStartTime,
        sampleStopTime: odrSyncData.sampleStopTime
      });

      const status = result.rawResponse.status();
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(600);
    }
  );
});
