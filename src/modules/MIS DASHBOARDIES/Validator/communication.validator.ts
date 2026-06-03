import { expect } from "@playwright/test";
import { CommStatsData, CommStatsResponse } from "../Mapper/communication.mapper";
export class CommStatsValidator {
  validateResponse(response:CommStatsResponse) {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }
  validateDates(data:CommStatsData) {
    expect(data.fromDate).toBeTruthy();
    expect(data.toDate).toBeTruthy();
    const from =new Date(data.fromDate);
    const to =new Date(data.toDate);
    expect(from.getTime()).toBeLessThanOrEqual(to.getTime());
  }
  validateOverall(data:CommStatsData) {
    expect(data.overall.total).toBeGreaterThanOrEqual(0);
    expect(data.overall.communicating.count).toBeGreaterThanOrEqual(0);
    expect(data.overall.nonCommunicating.count).toBeGreaterThanOrEqual(0);
    expect(data.overall.communicating.count + data.overall.nonCommunicating.count).toBe(data.overall.total);
  }
  validateCategories(data:CommStatsData) {
    expect(data.categories.length).toBeGreaterThan(0);
    const labels =new Set();
    for (const item of data.categories) {
      expect(item.label).toBeTruthy();
      expect(item.count).toBeGreaterThanOrEqual(0);
      expect(parseFloat(item.percentage)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(item.percentage)).toBeLessThanOrEqual(100);
      labels.add(item.label);
    }
    expect(labels.size).toBe(data.categories.length);
  }
  validatePhases(data:CommStatsData) {
    expect(data.phases.length).toBeGreaterThan(0);
    const labels =new Set();
    for (const item of data.phases) {
      expect(item.label).toBeTruthy();
      expect(item.count).toBeGreaterThanOrEqual(0);
      labels.add(item.label);
    }
    expect(labels.size).toBe(data.phases.length);
  }
  validateTrend(data:CommStatsData) {
    expect(data.communicationTrend.length).toBe(7);
    for (const item of data.communicationTrend) {
      expect(item.date).toBeTruthy();
      expect(item.ipCount).toBeGreaterThanOrEqual(0);
      expect(item.dpCount).toBeGreaterThanOrEqual(0);
      expect(item.lsCount).toBeGreaterThanOrEqual(0);
    }
  }
}