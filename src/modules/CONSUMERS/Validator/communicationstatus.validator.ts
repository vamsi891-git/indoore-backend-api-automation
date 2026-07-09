import { expect } from "@playwright/test";
import { EXPECTED_INTERVALS_PER_DAY } from "../Data/communicationstatus.data";
import type {
  CommunicationDelayed,
  CommunicationIntervals,
  CommunicationStatusData,
  CommunicationStatusErrorResponse,
  CommunicationStatusScenario,
  MappedCommunicationStatus,
} from "../Mapper/communicationstatus.mapper";

const IST_TODAY_YMD = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM = /^\d{2}:\d{2}$/;
const INTERVAL_DISPLAY = /^\d{2}:\d{2} \(\d{1,3}%\)$/;

export class CommunicationStatusValidator {
  validateSuccess(success: boolean) {
    expect(success).toBeTruthy();
  }

  validateNotFoundError(responseBody: CommunicationStatusErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("CONSUMER_NOT_FOUND");
    expect(responseBody.error.message.toLowerCase()).toContain(
      "consumer not found",
    );
  }

  validateBlankRefError(responseBody: CommunicationStatusErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toContain("ivrsno");
    const fieldErrors = responseBody.error.details?.fieldErrors?.ivrsNo;
    expect(Array.isArray(fieldErrors) && fieldErrors.length > 0).toBeTruthy();
  }

  validateInvalidDateError(responseBody: CommunicationStatusErrorResponse) {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toContain("date");
    const fieldErrors = responseBody.error.details?.fieldErrors?.date;
    expect(Array.isArray(fieldErrors) && fieldErrors.length > 0).toBeTruthy();
    expect(fieldErrors!.join(" ").toLowerCase()).toMatch(
      /yyyy-mm-dd|dd-mm-yyyy/,
    );
  }

  validateIntervalsShape(intervals: CommunicationIntervals) {
    expect(intervals).toHaveProperty("display");
    expect(intervals).toHaveProperty("subtitle");
    expect(intervals).toHaveProperty("receivedToday");
    expect(intervals).toHaveProperty("expectedPerDay");

    expect(typeof intervals.display).toBe("string");
    expect(INTERVAL_DISPLAY.test(intervals.display)).toBeTruthy();
    expect(typeof intervals.subtitle).toBe("string");
    expect(intervals.subtitle).toContain("Intervals");
    expect(intervals.subtitle).toContain(`${intervals.receivedToday}/`);
    expect(intervals.subtitle).toContain(`${intervals.expectedPerDay}`);

    expect(Number.isInteger(intervals.receivedToday)).toBeTruthy();
    expect(intervals.receivedToday).toBeGreaterThanOrEqual(0);
    expect(intervals.receivedToday).toBeLessThanOrEqual(
      intervals.expectedPerDay,
    );
    expect(intervals.expectedPerDay).toBe(EXPECTED_INTERVALS_PER_DAY);

    if (intervals.percent !== undefined) {
      expect(intervals.percent).toBeGreaterThan(0);
      expect(intervals.percent).toBeLessThanOrEqual(100);
      const expectedPercent = Math.min(
        100,
        Math.round(
          (intervals.receivedToday / intervals.expectedPerDay) * 100,
        ),
      );
      expect(intervals.percent).toBe(expectedPercent);
    } else {
      expect(intervals.receivedToday).toBe(0);
    }

    if (intervals.lastReadingToday !== undefined) {
      expect(typeof intervals.lastReadingToday).toBe("string");
      expect(intervals.lastReadingToday.length).toBeGreaterThan(0);
    }
  }

  validateDelayedShape(delayed: CommunicationDelayed) {
    expect(delayed).toHaveProperty("display");
    expect(delayed).toHaveProperty("subtitle");
    expect(delayed).toHaveProperty("delaySeconds");

    expect(typeof delayed.display).toBe("string");
    expect(HH_MM.test(delayed.display)).toBeTruthy();
    expect(delayed.subtitle).toBe("Delayed");
    expect(Number.isInteger(delayed.delaySeconds)).toBeTruthy();
    expect(delayed.delaySeconds).toBeGreaterThanOrEqual(0);

    const totalMinutes = Math.floor(delayed.delaySeconds / 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    expect(delayed.display).toBe(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    );

    if (delayed.lastSeen !== undefined) {
      expect(typeof delayed.lastSeen).toBe("string");
      expect(delayed.lastSeen.length).toBeGreaterThan(0);
    }
    if (delayed.previousReading !== undefined) {
      expect(typeof delayed.previousReading).toBe("string");
      expect(delayed.previousReading.length).toBeGreaterThan(0);
    }
  }

  validateStatusData(data: CommunicationStatusData, expectedDate?: string) {
    expect(data).toHaveProperty("date");
    expect(data).toHaveProperty("intervals");
    expect(data).toHaveProperty("delayed");
    expect(IST_TODAY_YMD.test(data.date)).toBeTruthy();

    if (expectedDate) {
      expect(data.date).toBe(expectedDate);
    }

    this.validateIntervalsShape(data.intervals);
    this.validateDelayedShape(data.delayed);

    if (data.latestReadingDateTime !== undefined) {
      expect(typeof data.latestReadingDateTime).toBe("string");
      expect(data.latestReadingDateTime.length).toBeGreaterThan(0);
    }
  }

  validateLiveOk(mapped: MappedCommunicationStatus, expectedDate?: string) {
    this.validateSuccess(mapped.success);
    expect(mapped.data).not.toBeNull();
    this.validateStatusData(mapped.data as CommunicationStatusData, expectedDate);
  }

  validateZeroIntervals(data: CommunicationStatusData, expectedDate?: string) {
    if (expectedDate) {
      expect(data.date).toBe(expectedDate);
    }
    expect(data.intervals.receivedToday).toBe(0);
    expect(data.intervals.display).toBe("00:00 (0%)");
    expect(data.intervals.subtitle).toBe("Intervals (0/96 Per Day)");
    expect(data.intervals.percent).toBeUndefined();
    expect(data.delayed.display).toBe("00:00");
    expect(data.delayed.delaySeconds).toBe(0);
    expect(data.latestReadingDateTime).toBeUndefined();
  }

  validateZeroIntervalsContract(mapped: MappedCommunicationStatus) {
    this.validateLiveOk(mapped, "2026-06-22");
    this.validateZeroIntervals(mapped.data as CommunicationStatusData, "2026-06-22");
  }

  /**
   * Widget resilience — unknown meter routes return HTTP 200 with
   * getEmptyConsumerCommunicationStatus (zero intervals / no readings).
   */
  validateGracefulEmptyFallback(
    mapped: MappedCommunicationStatus,
    expectedDate?: string,
  ) {
    this.validateLiveOk(mapped, expectedDate);
    this.validateZeroIntervals(mapped.data as CommunicationStatusData, expectedDate);
  }

  validateWithReadingsContract(mapped: MappedCommunicationStatus) {
    this.validateLiveOk(mapped, "2026-06-22");
    const data = mapped.data as CommunicationStatusData;
    expect(data.intervals.receivedToday).toBe(48);
    expect(data.intervals.percent).toBe(50);
    expect(data.intervals.lastReadingToday).toBeDefined();
    expect(data.delayed.delaySeconds).toBe(300);
    expect(data.delayed.lastSeen).toBeDefined();
    expect(data.delayed.previousReading).toBeDefined();
    expect(data.latestReadingDateTime).toBeDefined();
  }

  validateScenario(
    mapped: MappedCommunicationStatus,
    scenario: CommunicationStatusScenario,
    expectedDate?: string,
  ) {
    switch (scenario) {
      case "contract_zero_intervals":
        this.validateZeroIntervalsContract(mapped);
        break;
      case "contract_with_readings":
        this.validateWithReadingsContract(mapped);
        break;
      case "status_with_date":
      case "status_dd_mm_yyyy":
      case "status_by_meter":
        this.validateLiveOk(mapped, expectedDate ?? "2026-06-22");
        break;
      case "status_default_today":
        this.validateLiveOk(mapped);
        break;
      case "meter_not_found":
        this.validateGracefulEmptyFallback(mapped, expectedDate);
        break;
      default:
        break;
    }
  }
}
