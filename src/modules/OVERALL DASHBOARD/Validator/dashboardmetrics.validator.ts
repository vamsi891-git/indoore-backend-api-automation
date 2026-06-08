import { expect } from "@playwright/test";
import {
  DashboardData,
  DashboardMetricsResponse,
} from "../Mapper/dashboardmetrics.mapper";
export class DashboardMetricsValidator {
  validateResponse(response: DashboardMetricsResponse) {
    expect(response.success).toBeTruthy();
  }
  validateTimestamp(data: DashboardData) {
    expect(data.timeStamp).toBeTruthy();
    expect(isNaN(Date.parse(data.timeStamp))).toBeFalsy();
  }

  private validateSection(section: Record<string, any>) {
    for (const value of Object.values(section)) {
      if (typeof value !== "object" || value === null || value.count == null) {
        continue;
      }
      expect(value.count).toBeGreaterThanOrEqual(0);
      expect(Number(value.percentage)).toBeGreaterThanOrEqual(0);
      expect(value.label).toBeTruthy();
    }
  }
  validateConnectionStatus(data: DashboardData) {
    this.validateSection(data.connectionStatus);
  }
  validateCategoryWise(data: DashboardData) {
    this.validateSection(data.categoryWiseConsumer);
  }
  validatePhaseWise(data: DashboardData) {
    this.validateSection(data.phaseWiseConsumer);
  }
  validateOemWise(data: DashboardData) {
    this.validateSection(data.oemWiseConsumer);
  }
  validateConsumerType(data: DashboardData) {
    this.validateSection(data.consumerType);
  }
  validateNetworkDetails(data: DashboardData) {
    this.validateSection(data.networkDetails);
  }
  validateConnectionPercentage(data: DashboardData) {
    const total = Object.values(data.connectionStatus).reduce(
      (sum, item) => sum + Number(item.percentage),
      0,
    );
    expect(Math.abs(100 - total)).toBeLessThanOrEqual(1);
  }
  validateConsumerPercentage(data: DashboardData) {
    for (const item of Object.values(data.consumerType)) {
      expect(Number(item.percentage)).toBeGreaterThanOrEqual(0);
      expect(Number(item.percentage)).toBeLessThanOrEqual(100);
    }
  }
}
