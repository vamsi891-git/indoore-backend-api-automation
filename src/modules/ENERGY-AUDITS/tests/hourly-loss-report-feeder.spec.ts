import { test } from "../../../fixtures/api.fixture";
import { buildFeederHourlyLossReportQuery } from "../Data/hourly-loss-report.data";
import { registerHourlyLossReportTest } from "./hourly-loss-report.harness";

test.describe("Energy Audit Hourly Loss Report — Feeder", () => {
  test.setTimeout(180000);

  registerHourlyLossReportTest("feeder", () => buildFeederHourlyLossReportQuery());
});
