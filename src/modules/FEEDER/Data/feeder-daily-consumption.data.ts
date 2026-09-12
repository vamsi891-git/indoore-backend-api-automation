import { DEFAULT_FEEDER_CODE } from "../utils/feeder-env.helper";

export const feederDailyConsumptionData = {
  feederCode: DEFAULT_FEEDER_CODE,
  granularity: "day" as const,
  monthlyGranularity: "monthly" as const,
  expectedUnit: "kWh",
  maxResponseTime: 60_000,
};
