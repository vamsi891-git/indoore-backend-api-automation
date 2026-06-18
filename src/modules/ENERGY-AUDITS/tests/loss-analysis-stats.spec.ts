import { buildLossAnalysisStatsQuery } from "../Data/loss-analysis-stats.data";
import { registerLossAnalysisStatsTest } from "./loss-analysis-stats.harness";

registerLossAnalysisStatsTest("dtr", () => buildLossAnalysisStatsQuery());
