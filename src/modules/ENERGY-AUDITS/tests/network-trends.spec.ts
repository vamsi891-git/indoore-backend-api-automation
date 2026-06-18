import { buildNetworkTrendsQuery } from "../Data/network-trends.data";
import { registerNetworkTrendsTest } from "./network-trends.harness";

registerNetworkTrendsTest("billing", () => buildNetworkTrendsQuery("billing"));
registerNetworkTrendsTest("dp", () => buildNetworkTrendsQuery("dp"));
registerNetworkTrendsTest("ls", () => buildNetworkTrendsQuery("ls"));
