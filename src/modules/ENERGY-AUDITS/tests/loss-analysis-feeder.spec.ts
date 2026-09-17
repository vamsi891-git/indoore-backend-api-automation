import { test } from "../../../fixtures/api.fixture";
import {
  feederLossReportTypes,
  feederNetworkLookupId,
} from "../Data/loss-analysis.data";
import { registerLossAnalysisTests } from "./loss-analysis.harness";

test.describe("Energy Audit Loss Analysis — Feeder", () => {
  test.setTimeout(120000);

  registerLossAnalysisTests(
    "feeder",
    () => feederNetworkLookupId,
    feederLossReportTypes,
  );
});
