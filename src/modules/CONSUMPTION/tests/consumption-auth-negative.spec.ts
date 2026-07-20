import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { PatternConsumptionApi } from "../Api/patternconsumption.api";
import { MonthlyNetMeterApi } from "../Api/monthlynetmeter.api";
import { ConsumptionReportApi } from "../Api/consumption-report.api";
import { patternConsumptionData } from "../Data/patternconsumption.data";
import { monthlyNetMeterData } from "../Data/monthlynetmeter.data";
import { dailyConsumptionData } from "../Data/dailyconsumption.data";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import {ConsumptionCommonValidator, consumptionAuthData,consumptionPaths,type ConsumptionErrorBody,} from "../Validator/consumption-common.validator";
authTest.describe("Consumption API — Auth Negative", () => {
  authTest("Pattern consumption rejects missing auth",
    {
      tag: ["@consumption", "@pattern-consumption", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const rawResponse = await ConsumptionCommonValidator.getUnauthenticated(
        unauthenticatedApi,
        consumptionPaths.patternConsumption,
        {
          params: {
            patternType: patternConsumptionData.comparisonType,
            page: patternConsumptionData.page,
            limit: patternConsumptionData.limit,
            month: patternConsumptionData.month,
            year: patternConsumptionData.year,
          },
        },
      );
      const body = (await rawResponse.json().catch(() => ({}))) as ConsumptionErrorBody;
      validation.execute("Unauthorized", () =>
        ConsumptionCommonValidator.validateUnauthorizedError(
          rawResponse.status(),
          body,
        ),
      );
      validation.printSummary("Pattern Consumption — Missing Auth", 0);
    },
  );

  authTest("Consumption report rejects missing auth",
    {
      tag: ["@consumption", "@consumption-report", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const rawResponse = await ConsumptionCommonValidator.getUnauthenticated(
        unauthenticatedApi,
        consumptionPaths.report,
        {
          params: {
            reportType: "daily",
            page: dailyConsumptionData.page,
            limit: dailyConsumptionData.limit,
            fromDate: dailyConsumptionData.fromDate,
            toDate: dailyConsumptionData.toDate,
            month: dailyConsumptionData.month,
            year: dailyConsumptionData.year,
          },
        },
      );
      const body = (await rawResponse.json().catch(() => ({}))) as ConsumptionErrorBody;
      validation.execute("Unauthorized", () =>
        ConsumptionCommonValidator.validateUnauthorizedError(
          rawResponse.status(),
          body,
        ),
      );
      validation.printSummary("Consumption Report — Missing Auth", 0);
    },
  );

  authTest("Monthly net meter rejects missing auth",
    {
      tag: ["@consumption", "@monthly-net-meter", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const rawResponse = await ConsumptionCommonValidator.getUnauthenticated(
        unauthenticatedApi,
        consumptionPaths.monthlyNetMeter,
        {
          params: {
            page: monthlyNetMeterData.page,
            limit: monthlyNetMeterData.limit,
            month: monthlyNetMeterData.month,
            year: monthlyNetMeterData.year,
          },
        },
      );
      const body = (await rawResponse.json().catch(() => ({}))) as ConsumptionErrorBody;
      validation.execute("Unauthorized", () =>
        ConsumptionCommonValidator.validateUnauthorizedError(
          rawResponse.status(),
          body,
        ),
      );
      validation.printSummary("Monthly Net Meter — Missing Auth", 0);
    },
  );
  authTest("Monthly net meter rejects invalid bearer token",
    {
      tag: ["@consumption", "@monthly-net-meter", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      for (const authorization of [
        consumptionAuthData.invalidBearerToken,
        consumptionAuthData.malformedBearerToken,
        consumptionAuthData.emptyBearerToken,
      ]) {
        const rawResponse = await unauthenticatedApi.get(
          consumptionPaths.monthlyNetMeter,
          {
            headers: { Authorization: authorization },
            params: {
              page: monthlyNetMeterData.page,
              limit: monthlyNetMeterData.limit,
              month: monthlyNetMeterData.month,
              year: monthlyNetMeterData.year,
            },
          },
        );
        const body = (await rawResponse.json().catch(() => ({}))) as ConsumptionErrorBody;
        validation.execute(`Unauthorized (${authorization.slice(0, 20)})`, () =>
          ConsumptionCommonValidator.validateUnauthorizedError(
            rawResponse.status(),
            body,
          ),
        );
      }
      validation.printSummary("Monthly Net Meter — Invalid Token", 0);
    },
  );

  authTest("Consumption report rejects disallowed methods",
    {
      tag: ["@consumption", "@consumption-report", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const callers = ConsumptionCommonValidator.getDisallowedMethodCallers(
        unauthenticatedApi,
        consumptionPaths.report,
      );
      for (const method of consumptionAuthData.disallowedMethods) {
        const rawResponse = await callers[method]();
        validation.execute(`${method} rejected`, () =>
          ConsumptionCommonValidator.validateDisallowedMethodRejected(
            rawResponse.status(),
          ),
        );
      }
      validation.printSummary("Consumption Report — Disallowed Methods", 0);
    },
  );
});

test.describe("Consumption API — Authenticated smoke after auth negatives", () => {
  test(
    "Pattern, net meter, and report APIs remain reachable with valid auth",
    { tag: ["@consumption", "@smoke", "@positive"] },
    async ({ authenticatedApi }) => {
      const validation = new ValidationEngine();
      const patternApi = new PatternConsumptionApi(authenticatedApi);
      const netMeterApi = new MonthlyNetMeterApi(authenticatedApi);
      const reportApi = new ConsumptionReportApi(authenticatedApi);

      const pattern = await patternApi.getPatternConsumption(
        patternConsumptionData.comparisonType,
        1,
        5,
        patternConsumptionData.month,
        patternConsumptionData.year,
      );
      validation.execute("Pattern consumption status", () => {
        expect([200, 500]).toContain(pattern.rawResponse.status());
      });
      const netMeter = await netMeterApi.getMonthlyNetMeter(1, 5, 12, 2025);
      validation.execute("Monthly net meter status", () => {
        expect([200, 500]).toContain(netMeter.rawResponse.status());
      });
      const report = await reportApi.getReport(
        "daily",
        dailyConsumptionData.page,
        dailyConsumptionData.limit,
        dailyConsumptionData.fromDate,
        dailyConsumptionData.toDate,
        dailyConsumptionData.month,
        dailyConsumptionData.year,
      );
      validation.execute("Daily report status", () => {
        expect(report.rawResponse.status()).toBe(200);
      });
      validation.printSummary("Consumption — Auth Reachability", 0);
    },
  );
});
