import { expect } from "@playwright/test";
import {
  MappedMeterAlarmsData,
  MeterAlarmRow,
  MeterAlarmsResponse,
} from "../Mapper/commands-meter-alarms.mapper";

const METER_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const ALARM_CODE_PATTERN = /^METER_[A-Z0-9_]+$/;

/** Alarm codes observed in HES meter alarm payloads. */
export const KNOWN_METER_ALARM_CODES = [
  "METER_CONNECT_DISCONNECT",
  "METER_FIRST_BREATH",
  "METER_EARTH_LEAKAGE",
  "METER_LAST_GASP",
] as const;

export class CommandsMeterAlarmsValidator {
  validateResponse(body: MeterAlarmsResponse): void {
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  }

  validateErrorResponse(body: MeterAlarmsResponse): void {
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
  }

  validateAlarmCount(alarms: MeterAlarmRow[], requestedCount: number): void {
    expect(alarms.length).toBe(requestedCount);
  }

  validateMeterAlarmIdSequence(
    alarms: MeterAlarmRow[],
    startId: number,
  ): void {
    alarms.forEach((alarm, index) => {
      expect(alarm.meterAlarmId).toBe(startId + index);
    });
  }

  validateUniqueMeterAlarmIds(alarms: MeterAlarmRow[]): void {
    const ids = alarms.map((alarm) => alarm.meterAlarmId);
    expect(new Set(ids).size).toBe(ids.length);
  }

  validateMeterId(alarm: MeterAlarmRow): void {
    expect(alarm.meterId.length).toBeGreaterThan(0);
    expect(METER_ID_PATTERN.test(alarm.meterId)).toBe(true);
  }

  validateSequenceNumber(alarm: MeterAlarmRow): void {
    expect(Number.isInteger(alarm.sequenceNumber)).toBe(true);
    expect(alarm.sequenceNumber).toBeGreaterThan(0);
  }

  validateTimestamps(alarm: MeterAlarmRow): void {
    const alarmTimeMs = Date.parse(alarm.alarmTime);
    const createTimeMs = Date.parse(alarm.createTime);
    expect(Number.isFinite(alarmTimeMs)).toBe(true);
    expect(Number.isFinite(createTimeMs)).toBe(true);
  }

  validateAlarmActiveCodes(alarm: MeterAlarmRow): void {
    expect(Array.isArray(alarm.alarmActive)).toBe(true);
    expect(alarm.alarmActive.length).toBeGreaterThan(0);

    const uniqueCodes = new Set<string>();
    for (const code of alarm.alarmActive) {
      expect(code.length).toBeGreaterThan(0);
      expect(ALARM_CODE_PATTERN.test(code)).toBe(true);
      expect(
        uniqueCodes.has(code),
        `Duplicate alarm code ${code} on meterAlarmId=${alarm.meterAlarmId}`,
      ).toBe(false);
      uniqueCodes.add(code);
    }
  }

  validateAlarmRow(alarm: MeterAlarmRow): void {
    expect(Number.isInteger(alarm.meterAlarmId)).toBe(true);
    expect(alarm.meterAlarmId).toBeGreaterThan(0);
    this.validateMeterId(alarm);
    this.validateSequenceNumber(alarm);
    this.validateTimestamps(alarm);
    this.validateAlarmActiveCodes(alarm);
  }

  validateAllAlarms(alarms: MeterAlarmRow[]): void {
    for (const alarm of alarms) {
      this.validateAlarmRow(alarm);
    }
  }

  validateSequenceNumbersAscendingForConsecutiveSameMeter(
    alarms: MeterAlarmRow[],
  ): void {
    for (let i = 0; i < alarms.length - 1; i++) {
      if (alarms[i].meterId !== alarms[i + 1].meterId) {
        continue;
      }
      expect(alarms[i].sequenceNumber).toBeLessThanOrEqual(
        alarms[i + 1].sequenceNumber,
      );
    }
  }

  /** Only compare alarmTime for adjacent rows with the same meterId in response order. */
  validateAlarmTimeAscendingForConsecutiveSameMeter(
    alarms: MeterAlarmRow[],
  ): void {
    for (let i = 0; i < alarms.length - 1; i++) {
      if (alarms[i].meterId !== alarms[i + 1].meterId) {
        continue;
      }
      const current = Date.parse(alarms[i].alarmTime);
      const next = Date.parse(alarms[i + 1].alarmTime);
      expect(current).toBeLessThanOrEqual(next);
    }
  }

  validateFullContract(
    mapped: MappedMeterAlarmsData,
    startId: number,
    count: number,
  ): void {
    this.validateAlarmCount(mapped.alarms, count);
    this.validateMeterAlarmIdSequence(mapped.alarms, startId);
    this.validateUniqueMeterAlarmIds(mapped.alarms);
    this.validateAllAlarms(mapped.alarms);
    this.validateSequenceNumbersAscendingForConsecutiveSameMeter(mapped.alarms);
    this.validateAlarmTimeAscendingForConsecutiveSameMeter(mapped.alarms);
  }
}
