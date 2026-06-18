import { buildLossAnalysisTrendsQuery } from "../Data/loss-analysis-trends.data";
import { registerLossAnalysisTrendsTest } from "./loss-analysis-trends.harness";

registerLossAnalysisTrendsTest("dtr", () => buildLossAnalysisTrendsQuery());
