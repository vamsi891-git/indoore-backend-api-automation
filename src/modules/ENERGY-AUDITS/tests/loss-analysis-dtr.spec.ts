import { test } from "../../../fixtures/api.fixture";
import {
  dtrNetworkLookupId,
  lossReportTypes,
} from "../Data/loss-analysis.data";
import { registerLossAnalysisTests } from "./loss-analysis.harness";

test.describe("Energy Audit Loss Analysis — DTR", () => {
  test.setTimeout(120000);

  registerLossAnalysisTests(
    "dtr",
    () => dtrNetworkLookupId,
    lossReportTypes,
  );
});
