import { test } from "../../../fixtures/api.fixture";
import {
  feederNetworkLookupId,
  lossReportTypes,
} from "../Data/loss-analysis.data";
import { registerLossAnalysisTests } from "./loss-analysis.harness";

test.describe("Energy Audit Loss Analysis — Feeder", () => {
  test.setTimeout(120000);

  registerLossAnalysisTests(
    "feeder",
    () => feederNetworkLookupId,
    lossReportTypes,
  );
});
