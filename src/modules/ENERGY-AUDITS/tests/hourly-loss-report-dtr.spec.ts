import { test } from "../../../fixtures/api.fixture";
import { buildDtrHourlyLossReportQuery } from "../Data/hourly-loss-report.data";
import { registerHourlyLossReportTest } from "./hourly-loss-report.harness";

test.describe("Energy Audit Hourly Loss Report — DTR", () => {
  test.setTimeout(180000);

  registerHourlyLossReportTest("dtr", () => buildDtrHourlyLossReportQuery());
});
