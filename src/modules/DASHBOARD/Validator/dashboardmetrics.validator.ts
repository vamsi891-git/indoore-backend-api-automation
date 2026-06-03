import { expect } from "@playwright/test";
import { DashboardMetricsModel, MetricItem } from "../Mapper/dashboardmetrics.mapper";
export class DashboardMetricsValidator {
    validateTimestamp(data: DashboardMetricsModel) {
        expect(new Date(data.timestamp).toString()).not.toBe("Invalid Date");
    }
    validateMetricGroup(group: Record<string, any>) {
        Object.values(group).forEach(item => {
            if (typeof item !== "object" || item === null) {
                return;
            }
            expect(item.count).toBeGreaterThanOrEqual(0);
            expect(Number(item.percentage)).toBeGreaterThanOrEqual(0);
            expect(Number(item.percentage)).toBeLessThanOrEqual(100);
            expect(item.label).toBeTruthy();
        });
    }
    validateSparkline(group: Record<string, MetricItem>, expected: number) {
        Object.values(group).forEach(item => {
            if (item.sparkline) {
                expect(item.sparkline.length).toBe(expected);
                item.sparkline.forEach(x => {
                    expect(x).toBeGreaterThanOrEqual(0);
                });
            }
        });
    }
    validateTrend(group: Record<string, MetricItem>) {
        Object.values(group).forEach(item => {
            if (item.trend) {
                expect(["UP", "DOWN", "STABLE"]).toContain(item.trend.direction);
                expect(item.trend.comparisonLabel).toBeTruthy();
            }
        });
    }


    validateConnectionPercentageTotal(data: DashboardMetricsModel) {
        const total = Object.values(data.connectionStatus).reduce((sum, x) => sum + Number(x.percentage), 0);
        expect(Math.abs(100 - total)).toBeLessThanOrEqual(1);

    }

}