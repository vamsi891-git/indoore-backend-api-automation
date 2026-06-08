import { expect } from "@playwright/test";
import {
  DtrCommunicationModel,
  dtrCommunicationResponse,
} from "../Mapper/dtrcommunication.mapper";

export class DtrCommunicationValidator {
  validateResponse(response: dtrCommunicationResponse) {
    expect(response.success).toBeTruthy();
  }

  validatePeriod(data: DtrCommunicationModel) {
    expect(["daily", "weekly", "monthly", "yearly"]).toContain(data.period);
  }

  validatePointCount(data: DtrCommunicationModel) {
    if (data.period === "daily") {
      expect(data.points.length).toBe(30);
    }

    if (data.period === "monthly") {
      expect(data.points.length).toBe(24);
    }

    expect(data.points.length).toBeGreaterThan(0);
  }

  validatePoints(data: DtrCommunicationModel) {
    data.points.forEach((point) => {
      expect(point.label).toBeTruthy();
      expect(point.communicatingMeters).toBeGreaterThanOrEqual(0);
      expect(point.nonCommunicatingMeters).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(point.communicatingMeters)).toBeTruthy();
      expect(Number.isInteger(point.nonCommunicatingMeters)).toBeTruthy();
    });
  }

  validateUniqueLabels(data: DtrCommunicationModel) {
    const labels = data.points.map((point) => point.label);
    const duplicates = labels.filter(
      (label, index) => labels.indexOf(label) !== index,
    );
    expect(duplicates.length).toBe(0);
  }

  validateTotals(data: DtrCommunicationModel) {
    const communicatingTotal = data.points.reduce(
      (sum, point) => sum + point.communicatingMeters,
      0,
    );
    const nonCommunicatingTotal = data.points.reduce(
      (sum, point) => sum + point.nonCommunicatingMeters,
      0,
    );

    expect(communicatingTotal).toBeGreaterThanOrEqual(0);
    expect(nonCommunicatingTotal).toBeGreaterThanOrEqual(0);
  }

  validateCommunicationStatus(data: DtrCommunicationModel) {
    data.points.forEach((point) => {
      expect(
        point.communicatingMeters + point.nonCommunicatingMeters,
      ).toBeGreaterThanOrEqual(0);
    });
  }
}
