import { expect } from "@playwright/test";
import { DISCONNECTION_MONTH_COUNT } from "../Data/disconnectiondetails.data";
import type { DisconnectionDetailsData } from "../Mapper/disconnectiondetails.mapper";

export class DisconnectionDetailsValidator {
  validateSuccess(success: boolean): void {
    expect(success).toBe(true);
  }

  validateMonthSeries(data: DisconnectionDetailsData): void {
    expect(Array.isArray(data.months)).toBe(true);
    expect(
      data.months.length,
      "last six IST calendar months (oldest → newest)",
    ).toBe(DISCONNECTION_MONTH_COUNT);

    const labels: string[] = [];
    for (const row of data.months) {
      expect(row.month.trim().length, "month label").toBeGreaterThan(0);
      expect(/\d{4}/.test(row.month), `${row.month} includes a year`).toBe(
        true,
      );
      expect(
        Number.isInteger(row.disconnected),
        `${row.month} disconnected is a whole number`,
      ).toBe(true);
      expect(
        Number.isInteger(row.connected),
        `${row.month} connected is a whole number`,
      ).toBe(true);
      expect(row.disconnected, `${row.month} disconnected ≥ 0`).toBeGreaterThanOrEqual(
        0,
      );
      expect(row.connected, `${row.month} connected ≥ 0`).toBeGreaterThanOrEqual(
        0,
      );
      labels.push(row.month);
    }

    expect(new Set(labels).size, "each month is listed once").toBe(labels.length);
  }
}
