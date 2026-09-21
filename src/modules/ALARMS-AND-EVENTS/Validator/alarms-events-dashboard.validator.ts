import { expect } from "@playwright/test";
import { EXPECTED_DASHBOARD_COLUMNS } from "../Data/alarms-events-dashboard.data";
import {
  AlarmsEventsDashboardData,
  AlarmsEventsDashboardResponse,
} from "../Mapper/alarms-events-dashboard.mapper";
export class AlarmsEventsDashboardValidator {
  validateResponse(response: AlarmsEventsDashboardResponse) {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }
  validateColums(data: AlarmsEventsDashboardData) {
    expect(Object.keys(data)).toEqual(EXPECTED_DASHBOARD_COLUMNS);
  }
  validateCounts(data: AlarmsEventsDashboardData) {
    for (const key of EXPECTED_DASHBOARD_COLUMNS) {
      expect(typeof data[key]).toBe("number");
      expect(Number.isFinite(data[key])).toBeTruthy();
      expect(data[key]).toBeGreaterThanOrEqual(0);
    }
  }
}
