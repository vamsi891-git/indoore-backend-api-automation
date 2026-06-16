import { expect } from "@playwright/test";
import {
  MappedMeterSamplesData,
  MeterSampleRegisterValue,
  MeterSampleRow,
  MeterSamplesResponse,
} from "../Mapper/commands-meter-samples.mapper";

const NODE_ID_PATTERN = /^[0-9a-f]{2}(-[0-9a-f]{2}){7}$/i;
const DEVICE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const FORMATTED_OBIS_PATTERN = /^\d+\.\d+\.\d+\.\d+\.\d+\.\d+$/;
const ENCODED_OBIS_PATTERN = /^[A-Za-z0-9+/]+=*$/;
const BASE64_VALUE_PATTERN = /^[A-Za-z0-9+/]+=*$/;

/** DLMS clock register — formattedValue should match sampleTime when present. */
export const CLOCK_REGISTER_OBIS = "0.0.1.0.0.255";

export class CommandsMeterSamplesValidator {
  validateResponse(body: MeterSamplesResponse): void {
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  }

  validateErrorResponse(body: MeterSamplesResponse): void {
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
  }

  validateSampleCount(
    samples: MeterSampleRow[],
    requestedCount: number,
  ): void {
    expect(samples.length).toBe(requestedCount);
  }

  validateMeterSampleIdSequence(
    samples: MeterSampleRow[],
    startId: number,
  ): void {
    samples.forEach((sample, index) => {
      expect(sample.meterSampleId).toBe(startId + index);
    });
  }

  validateUniqueMeterSampleIds(samples: MeterSampleRow[]): void {
    const ids = samples.map((sample) => sample.meterSampleId);
    expect(new Set(ids).size).toBe(ids.length);
  }

  validateSequenceNumbersAscendingWithinDevice(samples: MeterSampleRow[]): void {
    const byDevice = new Map<string, MeterSampleRow[]>();
    for (const sample of samples) {
      const group = byDevice.get(sample.deviceId) ?? [];
      group.push(sample);
      byDevice.set(sample.deviceId, group);
    }

    for (const [, group] of byDevice) {
      for (let i = 0; i < group.length - 1; i++) {
        expect(group[i].sequenceNumber).toBeLessThanOrEqual(
          group[i + 1].sequenceNumber,
        );
      }
    }
  }

  validateSampleTimeAscendingWithinDevice(samples: MeterSampleRow[]): void {
    const byDevice = new Map<string, MeterSampleRow[]>();
    for (const sample of samples) {
      const group = byDevice.get(sample.deviceId) ?? [];
      group.push(sample);
      byDevice.set(sample.deviceId, group);
    }

    for (const [, group] of byDevice) {
      for (let i = 0; i < group.length - 1; i++) {
        const current = Date.parse(group[i].sampleTime);
        const next = Date.parse(group[i + 1].sampleTime);
        expect(current).toBeLessThanOrEqual(next);
      }
    }
  }

  validateSampleRowFields(sample: MeterSampleRow): void {
    expect(Number.isInteger(sample.meterSampleId)).toBe(true);
    expect(sample.meterSampleId).toBeGreaterThan(0);
    expect(Number.isInteger(sample.sequenceNumber)).toBe(true);
    expect(sample.sequenceNumber).toBeGreaterThan(0);
    expect(sample.deviceId.length).toBeGreaterThan(0);
    expect(DEVICE_ID_PATTERN.test(sample.deviceId)).toBe(true);
    expect(NODE_ID_PATTERN.test(sample.nodeId)).toBe(true);
    expect(ENCODED_OBIS_PATTERN.test(sample.profileObisCode)).toBe(true);
    expect(FORMATTED_OBIS_PATTERN.test(sample.formattedProfileObisCode)).toBe(
      true,
    );
    expect(Array.isArray(sample.registerValues)).toBe(true);
    expect(sample.registerValues.length).toBeGreaterThan(0);

    const sampleTimeMs = Date.parse(sample.sampleTime);
    const createTimeMs = Date.parse(sample.createTime);
    expect(Number.isFinite(sampleTimeMs)).toBe(true);
    expect(Number.isFinite(createTimeMs)).toBe(true);
    expect(createTimeMs).toBeGreaterThanOrEqual(sampleTimeMs);
  }

  validateRegisterRow(register: MeterSampleRegisterValue): void {
    expect(ENCODED_OBIS_PATTERN.test(register.registerObisCode)).toBe(true);
    expect(FORMATTED_OBIS_PATTERN.test(register.formattedRegisterObisCode)).toBe(
      true,
    );
    expect(typeof register.formattedValue).toBe("string");
    expect(Number.isInteger(register.attributeId)).toBe(true);
    expect(register.attributeId).toBeGreaterThan(0);
    expect(Number.isInteger(register.unit)).toBe(true);
    expect(register.unit).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(register.scalar)).toBe(true);
    expect(register.registerValue.length).toBeGreaterThan(0);
    expect(BASE64_VALUE_PATTERN.test(register.registerValue)).toBe(true);
    if (register.description !== null) {
      expect(register.description.trim().length).toBeGreaterThan(0);
    }
  }

  validateRegisterValues(sample: MeterSampleRow): void {
    const keys = new Set<string>();
    for (const register of sample.registerValues) {
      this.validateRegisterRow(register);
      const key = `${register.formattedRegisterObisCode}:${register.attributeId}`;
      expect(
        keys.has(key),
        `Duplicate register ${key} in meterSampleId=${sample.meterSampleId}`,
      ).toBe(false);
      keys.add(key);
    }
  }

  validateClockRegisterMatchesSampleTime(sample: MeterSampleRow): void {
    const clockRegister = sample.registerValues.find(
      (register) =>
        register.formattedRegisterObisCode === CLOCK_REGISTER_OBIS &&
        register.attributeId === 2,
    );
    if (!clockRegister?.formattedValue) {
      return;
    }
    expect(clockRegister.formattedValue).toBe(sample.sampleTime);
  }

  validateProfileObisConsistent(samples: MeterSampleRow[]): void {
    if (samples.length === 0) {
      return;
    }
    const profile = samples[0].formattedProfileObisCode;
    for (const sample of samples) {
      expect(sample.formattedProfileObisCode).toBe(profile);
    }
  }

  validateDeviceConsistencyWithinDeviceGroup(samples: MeterSampleRow[]): void {
    const byDevice = new Map<string, MeterSampleRow[]>();
    for (const sample of samples) {
      const group = byDevice.get(sample.deviceId) ?? [];
      group.push(sample);
      byDevice.set(sample.deviceId, group);
    }

    for (const [, group] of byDevice) {
      if (group.length === 1) {
        continue;
      }
      const first = group[0];
      for (const sample of group) {
        expect(sample.nodeId).toBe(first.nodeId);
        expect(sample.profileObisCode).toBe(first.profileObisCode);
      }
    }
  }

  validateAllSamples(samples: MeterSampleRow[]): void {
    for (const sample of samples) {
      this.validateSampleRowFields(sample);
      this.validateRegisterValues(sample);
      this.validateClockRegisterMatchesSampleTime(sample);
    }
  }

  validateFullContract(
    mapped: MappedMeterSamplesData,
    startId: number,
    count: number,
  ): void {
    this.validateSampleCount(mapped.samples, count);
    this.validateMeterSampleIdSequence(mapped.samples, startId);
    this.validateUniqueMeterSampleIds(mapped.samples);
    this.validateSequenceNumbersAscendingWithinDevice(mapped.samples);
    this.validateSampleTimeAscendingWithinDevice(mapped.samples);
    this.validateAllSamples(mapped.samples);
    this.validateProfileObisConsistent(mapped.samples);
    this.validateDeviceConsistencyWithinDeviceGroup(mapped.samples);
  }
}
