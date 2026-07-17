import { expect } from "@playwright/test";
import {
    dashboardMetricsConsumerTrendLength,
    dashboardMetricsMetricGroups,
    dashboardMetricsNetworkTrendLength,
    dashboardMetricsSparklineLength,
    dashboardMetricsSuccessMessage,
} from "../Data/dashboardmetrics.data";
import type {
    DashboardMetricsResponse,
    DashboardMetricsScenario,
    MappedDashboardMetrics,
    MetricItem,
} from "../Mapper/dashboardmetrics.mapper";

const TREND_DIRECTIONS = ["UP", "DOWN", "STABLE"];

export class DashboardMetricsValidator {
    validateResponseEnvelope(response: DashboardMetricsResponse): void {
        expect(response.success).toBe(true);
        expect(response.data).toBeDefined();
        if (response.message != null) {
            expect(response.message).toBe(dashboardMetricsSuccessMessage);
        }
    }

    validateSuccess(success: boolean): void {
        expect(success).toBeTruthy();
    }

    validateTimestamp(data: MappedDashboardMetrics): void {
        expect(data.timestamp).toBeTruthy();
        expect(Number.isNaN(Date.parse(data.timestamp))).toBeFalsy();
    }

    validateMetricGroup(group: Record<string, MetricItem>): void {
        Object.values(group).forEach((item) => {
            expect(item.count).toBeGreaterThanOrEqual(0);
            expect(item.percentage).toBeGreaterThanOrEqual(0);
            expect(item.percentage).toBeLessThanOrEqual(100);
            expect(item.label).toBeTruthy();
            expect(Number.isFinite(item.count)).toBeTruthy();
            expect(Number.isFinite(item.percentage)).toBeTruthy();
        });
    }

    validateFields(data: MappedDashboardMetrics): void {
        for (const field of dashboardMetricsMetricGroups) {
            expect(data).toHaveProperty(field);
            expect(typeof data[field]).toBe("object");
        }
    }

    validateTotalMeterCount(data: MappedDashboardMetrics): void {
        if (data.totalMeterCount !== undefined) {
            expect(data.totalMeterCount).toBeGreaterThanOrEqual(0);
        }
    }

    validateSectionPercentageTotal(group: Record<string, MetricItem>,tolerance = 1,): void {
        const items = Object.values(group);
        if (items.length === 0) {
            return;
        }
        const total = items.reduce((sum, item) => sum + item.percentage, 0);
        expect(Math.abs(100 - total)).toBeLessThanOrEqual(tolerance);
    }
    validateSparkline(group: Record<string, MetricItem>): void {
        Object.values(group).forEach((item) => {
            if (!item.sparkline) {
                return;
            }
            expect(item.sparkline.length).toBe(dashboardMetricsSparklineLength);
            item.sparkline.forEach((value) => {
                expect(value).toBeGreaterThanOrEqual(0);
            });
        });
    }
    validateTrend(group: Record<string, MetricItem>): void {
        Object.values(group).forEach((item) => {
            if (!item.trend) {
                return;
            }
            expect(TREND_DIRECTIONS).toContain(item.trend.direction);
            expect(item.trend.comparisonLabel).toBeTruthy();
        });
    }
    validateConsumerTrends(group: Record<string, MetricItem>,expectedLength = dashboardMetricsConsumerTrendLength,): void {
        Object.values(group).forEach((item) => {
            if (!item.trends) {
                return;
            }
            expect(item.trends.length).toBe(expectedLength);
            item.trends.forEach((value) => {
                expect(value).toBeGreaterThanOrEqual(0);
            });
            expect(item.trends.at(-1)).toBe(item.count);
        });
    }
    validateNetworkTrends(group: Record<string, MetricItem>,expectedLength = dashboardMetricsNetworkTrendLength,): void {
        Object.values(group).forEach((item) => {
            if (!item.trends) {
                return;
            }
            expect(item.trends.length).toBe(expectedLength);
            item.trends.forEach((value) => {
                expect(value).toBeGreaterThanOrEqual(0);
            });
            expect(item.trends.at(-1)).toBe(item.count);
        });
    }
    validateConnectionPercentageTotal(data: MappedDashboardMetrics): void {
        this.validateSectionPercentageTotal(data.connectionStatus);
    }
    validateConnectionCounts(data: MappedDashboardMetrics): void {
        const { cd, td, pd } = data.connectionStatus;
        if (!cd || !td || !pd) {
            return;
        }
        const activeStatusTotal = cd.count + td.count + pd.count;
        if (data.totalMeterCount != null) {
            expect(activeStatusTotal).toBe(data.totalMeterCount);
        }
    }
    validateFleetAlignment(data: MappedDashboardMetrics): void {
        if (data.totalMeterCount == null) {
            return;
        }
        const totalConsumers = data.consumerType.totalConsumers;
        const networkConsumers = data.networkDetails.consumers;
        if (totalConsumers) {
            expect(totalConsumers.count).toBe(data.totalMeterCount);
        }
        if (networkConsumers) {
            expect(networkConsumers.count).toBe(data.totalMeterCount);
        }
    }
    validateLiveOk(mapped: MappedDashboardMetrics): void {
        this.validateSuccess(mapped.success);
        this.validateFields(mapped);
        this.validateTimestamp(mapped);
        this.validateTotalMeterCount(mapped);
        this.validateMetricGroup(mapped.connectionStatus);
        this.validateMetricGroup(mapped.categoryWiseConsumer);
        this.validateMetricGroup(mapped.phaseWiseConsumer);
        this.validateMetricGroup(mapped.oemWiseConsumer);
        this.validateMetricGroup(mapped.consumerType);
        this.validateMetricGroup(mapped.networkDetails);
        this.validateSparkline(mapped.consumerType);
        this.validateTrend(mapped.consumerType);
        this.validateConsumerTrends(mapped.consumerType);
        this.validateNetworkTrends(mapped.networkDetails);
        this.validateConnectionPercentageTotal(mapped);
        this.validateConnectionCounts(mapped);
        this.validateSectionPercentageTotal(mapped.categoryWiseConsumer);
        this.validateSectionPercentageTotal(mapped.phaseWiseConsumer);
        this.validateSectionPercentageTotal(mapped.oemWiseConsumer);
        this.validateNetworkHierarchyPercentageTotal(mapped);
        this.validateFleetAlignment(mapped);
    }
    validateNetworkHierarchyPercentageTotal(data: MappedDashboardMetrics,tolerance = 0.5,): void {
        const { substations, feeders, dtrs } = data.networkDetails;
        const items = [substations, feeders, dtrs].filter(
            (item): item is MetricItem => item != null,
        );
        if (items.length === 0) {
            return;
        }
        const total = items.reduce((sum, item) => sum + item.percentage, 0);
        expect(Math.abs(100 - total)).toBeLessThanOrEqual(tolerance);
    }

    validateLiveFullContract(mapped: MappedDashboardMetrics): void {
        this.validateLiveOk(mapped);
        expect(mapped.totalMeterCount).toBe(132808);
        expect(mapped.connectionStatus.cd?.count).toBe(127910);
        expect(mapped.categoryWiseConsumer.residential?.count).toBe(95806);
        expect(mapped.oemWiseConsumer["L&T"]?.count).toBe(123825);
        expect(mapped.consumerType.prepaid?.count).toBe(16);
        expect(mapped.consumerType.netMeter?.count).toBe(200);
        expect(mapped.networkDetails.dtrs?.count).toBe(5281);
        expect(mapped.networkDetails.substations?.percentage).toBe(0.4);
    }
    validateConnectionContract(mapped: MappedDashboardMetrics): void {
        this.validateConnectionPercentageTotal(mapped);
        this.validateConnectionCounts(mapped);
        expect(mapped.totalMeterCount).toBe(132808);
        expect(mapped.connectionStatus.cd?.count).toBe(127910);
        expect(mapped.connectionStatus.cd?.label).toBe("Connected");
        expect(mapped.connectionStatus.inactive?.count).toBe(0);
    }
    validateConsumerTrendsContract(mapped: MappedDashboardMetrics): void {
        this.validateSuccess(mapped.success);
        this.validateConsumerTrends(mapped.consumerType);
        expect(mapped.consumerType.totalConsumers?.trends?.length).toBe(
            dashboardMetricsConsumerTrendLength,
        );
        expect(mapped.consumerType.totalConsumers?.trends?.at(-1)).toBe(
            132808,
        );
        expect(mapped.consumerType.prepaid?.trends?.at(-1)).toBe(16);
    }
    validateNetworkTrendsContract(mapped: MappedDashboardMetrics): void {
        this.validateSuccess(mapped.success);
        this.validateNetworkTrends(mapped.networkDetails);
        expect(mapped.networkDetails.substations?.trends?.length).toBe(
            dashboardMetricsNetworkTrendLength,
        );
        expect(mapped.networkDetails.dtrs?.trends?.at(-1)).toBe(5281);
        this.validateNetworkHierarchyPercentageTotal(mapped);
    }

    validateScenario(mapped: MappedDashboardMetrics,scenario: DashboardMetricsScenario, ): void {
        switch (scenario) {
            case "contract_live_full":
                this.validateLiveFullContract(mapped);
                break;
            case "contract_connection_status":
                this.validateConnectionContract(mapped);
                break;
            case "contract_consumer_type_trends":
                this.validateConsumerTrendsContract(mapped);
                break;
            case "contract_network_details_trends":
                this.validateNetworkTrendsContract(mapped);
                break;
            case "dev_live_primary":
            case "dev_ignore_unknown_query":
                this.validateLiveOk(mapped);
                break;
            default:
                break;
        }
    }
}
