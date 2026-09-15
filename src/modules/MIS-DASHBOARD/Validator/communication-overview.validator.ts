import { expect } from "@playwright/test";
import { EXPECTED_OVERVIEW_PHASES } from "../Data/communication-overview.data";
import {
  CommunicationOverviewData,
  CommunicationOverviewResponse,
} from "../Mapper/communication-overview.mapper";

export class CommunicationOverviewValidator {
  validateResponse(response: CommunicationOverviewResponse) {
    expect(response.success).toBeTruthy();
    expect(response.data).toBeDefined();
  }

  validateDates(data: CommunicationOverviewData) {
    expect(data.fromDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.toDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.fromDate <= data.toDate).toBeTruthy();
  }

  validateWindow(
    data: CommunicationOverviewData,
    expectedFromDate?: string,
    expectedToDate?: string,
    expectSameDayWindow?: boolean,
  ) {
    this.validateDates(data);
    if (expectedFromDate) {
      expect(data.fromDate).toBe(expectedFromDate);
    }
    if (expectedToDate) {
      expect(data.toDate).toBe(expectedToDate);
    }
    if (expectSameDayWindow) {
      expect(data.fromDate).toBe(data.toDate);
    }
  }

  validateOverall(data: CommunicationOverviewData) {
    expect(data.overall.total).toBeGreaterThanOrEqual(0);
    expect(data.overall.communicating.count).toBeGreaterThanOrEqual(0);
    expect(data.overall.nonCommunicating.count).toBeGreaterThanOrEqual(0);
    expect(
      data.overall.communicating.count + data.overall.nonCommunicating.count,
    ).toBe(data.overall.total);
    this.validateShare(
      data.overall.communicating.count,
      data.overall.total,
      data.overall.communicating.percentage,
    );
    this.validateShare(
      data.overall.nonCommunicating.count,
      data.overall.total,
      data.overall.nonCommunicating.percentage,
    );
  }

  validatePhases(data: CommunicationOverviewData) {
    expect(data.phases.length).toBeGreaterThan(0);
    for (const item of data.phases) {
      expect(item.label).toBeTruthy();
      expect(item.count).toBeGreaterThanOrEqual(0);
      this.validateShare(item.count, data.overall.total, item.percentage);
    }
  }

  validateExpectedPhaseLabels(
    data: CommunicationOverviewData,
    expected = EXPECTED_OVERVIEW_PHASES,
  ) {
    expect(data.phases.map((item) => item.label).sort()).toEqual(
      [...expected].sort(),
    );
  }

  validateUniquePhaseLabels(data: CommunicationOverviewData) {
    const labels = data.phases.map((item) => item.label);
    expect(new Set(labels).size).toBe(labels.length);
  }

  validatePhaseCountsMatchCommunicating(data: CommunicationOverviewData) {
    const sum = data.phases.reduce((total, item) => total + item.count, 0);
    expect(sum).toBe(data.overall.communicating.count);
  }

  validateAllEqualsConsumerPlusDtr(
    allMeters: CommunicationOverviewData,
    consumers: CommunicationOverviewData,
    dtrs: CommunicationOverviewData,
  ) {
    expect(allMeters.overall.total).toBe(
      consumers.overall.total + dtrs.overall.total,
    );
    expect(allMeters.overall.communicating.count).toBe(
      consumers.overall.communicating.count + dtrs.overall.communicating.count,
    );
    expect(allMeters.overall.nonCommunicating.count).toBe(
      consumers.overall.nonCommunicating.count +
        dtrs.overall.nonCommunicating.count,
    );
  }

  private validateShare(count: number, total: number, percentage: string) {
    const actual = Number(percentage);
    expect(Number.isNaN(actual)).toBeFalsy();
    expect(actual).toBeGreaterThanOrEqual(0);
    expect(actual).toBeLessThanOrEqual(100);
    const expected = total === 0 ? 0 : (count / total) * 100;
    expect(actual).toBeCloseTo(expected, 1);
  }
}
