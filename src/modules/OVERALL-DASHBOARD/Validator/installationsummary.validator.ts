import { expect } from "@playwright/test";
import type { InstallationSummaryData } from "../Mapper/installationsummary.mapper";

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export class InstallationSummaryValidator {
  validateSuccess(success: boolean): void {
    expect(success).toBe(true);
  }

  validateCounts(data: InstallationSummaryData): void {
    const total = data.totalMeterCount;
    const mapped = data.installedMeters.meterCount;
    const unmapped = data.nonInstalledMeters.meterCount;

    expect(Number.isInteger(total), "totalMeterCount is a whole number").toBe(
      true,
    );
    expect(Number.isInteger(mapped), "mapped meterCount is a whole number").toBe(
      true,
    );
    expect(
      Number.isInteger(unmapped),
      "unmapped meterCount is a whole number",
    ).toBe(true);
    expect(total, "totalMeterCount ≥ 0").toBeGreaterThanOrEqual(0);
    expect(mapped, "mapped meterCount ≥ 0").toBeGreaterThanOrEqual(0);
    expect(unmapped, "unmapped meterCount ≥ 0").toBeGreaterThanOrEqual(0);
    expect(
      mapped + unmapped,
      "mapped + unmapped equals the fleet total",
    ).toBe(total);
  }

  validateTitles(data: InstallationSummaryData): void {
    const mappedTitle = data.installedMeters.title.trim().toLowerCase();
    const unmappedTitle = data.nonInstalledMeters.title.trim().toLowerCase();
    expect(mappedTitle.length).toBeGreaterThan(0);
    expect(unmappedTitle.length).toBeGreaterThan(0);
    expect(mappedTitle.includes("unmapped"), "mapped bucket is not unmapped").toBe(
      false,
    );
    expect(mappedTitle.includes("mapped"), "mapped bucket title").toBe(true);
    expect(unmappedTitle.includes("unmapped"), "unmapped bucket title").toBe(
      true,
    );
  }

  validateSharePercents(data: InstallationSummaryData): void {
    const total = data.totalMeterCount;
    const mapped = data.installedMeters;
    const unmapped = data.nonInstalledMeters;

    expect(mapped.sharePercent).toBeGreaterThanOrEqual(0);
    expect(unmapped.sharePercent).toBeGreaterThanOrEqual(0);

    if (total === 0) {
      expect(mapped.sharePercent).toBe(0);
      expect(unmapped.sharePercent).toBe(0);
      return;
    }

    expect(
      Math.abs(mapped.sharePercent - round3((mapped.meterCount / total) * 100)),
    ).toBeLessThanOrEqual(0.002);
    expect(
      Math.abs(
        unmapped.sharePercent - round3((unmapped.meterCount / total) * 100),
      ),
    ).toBeLessThanOrEqual(0.002);
    expect(
      Math.abs(100 - (mapped.sharePercent + unmapped.sharePercent)),
    ).toBeLessThanOrEqual(0.002);
  }
}
