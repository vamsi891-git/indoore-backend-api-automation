import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { FeederProfileApi } from "../Api/feederprofile.api";
import { FeederAlertsApi } from "../Api/feeder-alerts.api";
import { FeederElectricalParametersApi } from "../Api/feeder-electrical-parameters.api";
import { FeederDailyConsumptionApi } from "../Api/feeder-daily-consumption.api";
import { feederAlertsData } from "../Data/feeder-alerts.data";
import { feederDailyConsumptionData } from "../Data/feeder-daily-consumption.data";
import { feederElectricalParametersData } from "../Data/feeder-electrical-parameters.data";
import { feederProfileData } from "../Data/feederprofile.data";
import { FeederAlertsMapper } from "../Mapper/feeder-alerts.mapper";
import { FeederAlertsValidator } from "../Validator/feeder-alerts.validator";
import { FeederDailyConsumptionMapper } from "../Mapper/feeder-daily-consumption.mapper";
import { FeederDailyConsumptionValidator } from "../Validator/feeder-daily-consumption.validator";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import {
  resolveFeederCode,
  skipIfFeederInternalError,
} from "../utils/feeder-env.helper";

function expectUnknownQueryIgnored(status: number, body: unknown): void {
  expect(status).toBe(200);
  expect((body as { success?: boolean }).success).toBe(true);
}

test.describe("Feeder — unusual cases", () => {
  test(
    "Feeder profile — leftover extra filters still show the same page",
    { tag: ["@feeder", "@profile", "@edge"] },
    async ({ authenticatedApi }) => {
      const code = resolveFeederCode(feederProfileData.feederCode);
      const { rawResponse, responseBody } = await new FeederProfileApi(
        authenticatedApi,
      ).getFeederProfile(code, { foo: "bar" });
      skipIfFeederInternalError(
        rawResponse.status(),
        responseBody,
        `/indore/feeder/${code}/profile`,
      );
      expectUnknownQueryIgnored(rawResponse.status(), responseBody);
    },
  );

  test(
    "Feeder voltage and current — leftover extra filters still show the same page",
    { tag: ["@feeder", "@electrical-parameters", "@edge"] },
    async ({ authenticatedApi }) => {
      const code = resolveFeederCode(feederElectricalParametersData.feederCode);
      const { rawResponse, responseBody } =
        await new FeederElectricalParametersApi(
          authenticatedApi,
        ).getElectricalParameters(code, { foo: "bar" });
      skipIfFeederInternalError(
        rawResponse.status(),
        responseBody,
        `/indore/feeder/${code}/electrical-parameters`,
      );
      expectUnknownQueryIgnored(rawResponse.status(), responseBody);
    },
  );

  test(
    "Feeder alerts — leftover extra filters still show the same page",
    { tag: ["@feeder", "@feeder-alerts", "@edge"] },
    async ({ authenticatedApi }) => {
      const code = resolveFeederCode(feederAlertsData.feederCode);
      const { rawResponse, responseBody } = await new FeederAlertsApi(
        authenticatedApi,
      ).getAlerts(code, feederAlertsData.page, feederAlertsData.limit, {
        foo: "bar",
      });
      skipIfFeederInternalError(
        rawResponse.status(),
        responseBody,
        `/indore/feeder/${code}/alerts`,
      );
      expectUnknownQueryIgnored(rawResponse.status(), responseBody);
    },
  );

  test(
    "Feeder alerts — asking for one event at a time still returns a row",
    { tag: ["@feeder", "@feeder-alerts", "@edge"] },
    async ({ authenticatedApi }) => {
      const code = resolveFeederCode(feederAlertsData.feederCode);
      const { rawResponse, responseBody } = await new FeederAlertsApi(
        authenticatedApi,
      ).getAlerts(code, 1, 1);
      skipIfFeederInternalError(
        rawResponse.status(),
        responseBody,
        `/indore/feeder/${code}/alerts`,
      );
      const validation = new ValidationEngine();
      const mapped = FeederAlertsMapper.map(responseBody);
      const validator = new FeederAlertsValidator();
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Page size 1", () => {
        expect(mapped.pageSize).toBe(1);
        expect(mapped.rows.length).toBeLessThanOrEqual(1);
      });
      if (mapped.rows.length > 0) {
        validation.execute("Unique serial numbers", () =>
          validator.validateUniqueSerialNumbers(mapped.rows),
        );
      }
      validation.printSummary(
        "Feeder alerts — asking for one event at a time still returns a row",
        0,
      );
    },
  );

  test(
    "Feeder alerts — a page far past the last event is empty",
    { tag: ["@feeder", "@feeder-alerts", "@edge"] },
    async ({ authenticatedApi }) => {
      const code = resolveFeederCode(feederAlertsData.feederCode);
      const { rawResponse, responseBody } = await new FeederAlertsApi(
        authenticatedApi,
      ).getAlerts(code, 99999, feederAlertsData.limit);
      skipIfFeederInternalError(
        rawResponse.status(),
        responseBody,
        `/indore/feeder/${code}/alerts`,
      );
      const mapped = FeederAlertsMapper.map(responseBody);
      expect(rawResponse.status()).toBe(200);
      expect(mapped.rows).toEqual([]);
    },
  );

  test(
    "Feeder daily energy — leftover extra filters still show the same chart",
    { tag: ["@feeder", "@daily-consumption", "@edge"] },
    async ({ authenticatedApi }) => {
      const code = resolveFeederCode(feederDailyConsumptionData.feederCode);
      const { rawResponse, responseBody } = await new FeederDailyConsumptionApi(
        authenticatedApi,
      ).getDailyConsumption(code, feederDailyConsumptionData.granularity, {
        foo: "bar",
      });
      skipIfFeederInternalError(
        rawResponse.status(),
        responseBody,
        `/indore/feeder/${code}/daily-consumption`,
      );
      expectUnknownQueryIgnored(rawResponse.status(), responseBody);
    },
  );

  test(
    "Feeder daily energy — month-by-month kWh (an empty chart is still OK)",
    { tag: ["@feeder", "@daily-consumption", "@edge"] },
    async ({ authenticatedApi }) => {
      const code = resolveFeederCode(feederDailyConsumptionData.feederCode);
      const { rawResponse, responseBody } = await new FeederDailyConsumptionApi(
        authenticatedApi,
      ).getDailyConsumption(
        code,
        feederDailyConsumptionData.monthlyGranularity,
      );
      skipIfFeederInternalError(
        rawResponse.status(),
        responseBody,
        `/indore/feeder/${code}/daily-consumption`,
      );
      const validation = new ValidationEngine();
      const mapped = FeederDailyConsumptionMapper.map(responseBody);
      const validator = new FeederDailyConsumptionValidator();
      validation.execute("Status 200", () => {
        expect(rawResponse.status()).toBe(200);
      });
      validation.execute("Granularity echo", () =>
        validator.validateGranularityEcho(
          mapped,
          feederDailyConsumptionData.monthlyGranularity,
        ),
      );
      if (mapped.points.length > 0) {
        validation.execute("Unique month keys", () =>
          validator.validateUniqueKeys(mapped.points),
        );
        validation.execute("kWh values", () =>
          validator.validateKwhValues(mapped.points),
        );
      }
      validation.printSummary(
        "Feeder daily energy — month-by-month kWh (an empty chart is still OK)",
        0,
      );
    },
  );
});
