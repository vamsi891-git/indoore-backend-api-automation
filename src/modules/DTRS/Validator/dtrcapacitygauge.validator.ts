import { expect } from "@playwright/test";
import {
  dtrCapacityGaugeBandUnits,
  dtrCapacityGaugeContractPercentFormulaMeta,
  dtrCapacityGaugeExpectedBands,
} from "../Data/dtrcapacitygauge.data";
import type {
  CapacityBand,
  CapacityGaugeData,
  DtrCapacityGaugeErrorResponse,
  DtrCapacityGaugeResponse,
  DtrCapacityGaugeScenario,
  MappedDtrCapacityGauge,
} from "../Mapper/dtrcapacitygauge.mapper";

/** Mirrors backend `gaugePercent()` — returns null when value or capacity missing. */
function backendGaugePercent(
  value: number | null,
  capacity: number | null,
): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (capacity == null || !Number.isFinite(capacity) || capacity <= 0) {
    return null;
  }
  return Math.min(100, Math.round((100 * Math.max(0, value)) / capacity));
}

/** Mirrors backend `roundGauge()`. */
function backendRoundGauge(n: number | null): number | null {
  if (n == null || !Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

function findBand(bands: CapacityBand[], label: string): CapacityBand {
  const band = bands.find((b) => b.label === label);
  expect(band).toBeDefined();
  return band!;
}

export class DtrCapacityGaugeValidator {
  validateSuccess(success: boolean): void {
    expect(success).toBeTruthy();
  }

  validateNotFoundError(responseBody: DtrCapacityGaugeErrorResponse): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("DTR_NOT_FOUND");
    expect(responseBody.error.message.toLowerCase()).toContain("dtr not found");
  }

  validateBlankCodeError(responseBody: DtrCapacityGaugeErrorResponse): void {
    expect(responseBody.success).toBeFalsy();
    expect(responseBody.error).toBeDefined();
    expect(responseBody.error.code).toBe("VALIDATION_ERROR");
    expect(responseBody.error.message.toLowerCase()).toMatch(
      /dtr|network|code/i,
    );
  }

  validateResponseEnvelope(response: DtrCapacityGaugeResponse): void {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  }

  validateFields(data: CapacityGaugeData): void {
    expect(data).toHaveProperty("ratedCapacityKva");
    expect(data).toHaveProperty("bands");
    expect(Array.isArray(data.bands)).toBeTruthy();
  }

  validateBandCount(bands: CapacityBand[]): void {
    expect(bands.length).toBe(5);
  }

  validateBandStructure(bands: CapacityBand[]): void {
    bands.forEach((band) => {
      expect(band).toHaveProperty("label");
      expect(band).toHaveProperty("value");
      expect(band).toHaveProperty("percent");
      expect(band).toHaveProperty("unit");
    });
  }

  validateBandOrder(bands: CapacityBand[]): void {
    const labels = bands.map((x) => x.label);
    expect(labels).toEqual([...dtrCapacityGaugeExpectedBands]);
  }

  validateTypes(data: CapacityGaugeData): void {
    expect(
      data.ratedCapacityKva === null || typeof data.ratedCapacityKva === "number",
    ).toBeTruthy();
    data.bands.forEach((band) => {
      expect(typeof band.label).toBe("string");
      expect(band.value === null || typeof band.value === "number").toBeTruthy();
      expect(
        band.percent === null || typeof band.percent === "number",
      ).toBeTruthy();
      expect(typeof band.unit).toBe("string");
    });
  }

  validateUnits(bands: CapacityBand[]): void {
    bands.forEach((band) => {
      const expectedUnit =
        dtrCapacityGaugeBandUnits[
          band.label as keyof typeof dtrCapacityGaugeBandUnits
        ];
      expect(expectedUnit).toBeDefined();
      expect(band.unit).toBe(expectedUnit);
    });
  }

  validateNullablePercentages(bands: CapacityBand[]): void {
    bands.forEach((band) => {
      if (band.percent !== null) {
        expect(band.percent).toBeGreaterThanOrEqual(0);
        expect(band.percent).toBeLessThanOrEqual(100);
        expect(Number.isInteger(band.percent)).toBeTruthy();
      }
    });
  }

  validateNullableValues(bands: CapacityBand[]): void {
    bands.forEach((band) => {
      if (band.value !== null) {
        expect(band.value).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(band.value)).toBeTruthy();
        expect(band.value).toBe(backendRoundGauge(band.value));
      }
    });
  }

  validateCapacityLogic(
    ratedCapacityKva: number | null,
    bands: CapacityBand[],
  ): void {
    if (ratedCapacityKva === null || ratedCapacityKva <= 0) {
      bands.forEach((band) => {
        expect(band.percent).toBeNull();
      });
    }
  }

  validateGaugePercentFormula(
    ratedCapacityKva: number | null,
    bands: CapacityBand[],
  ): void {
    if (ratedCapacityKva == null || ratedCapacityKva <= 0) {
      return;
    }

    bands.forEach((band) => {
      expect(band.percent).toBe(
        backendGaugePercent(band.value, ratedCapacityKva),
      );
    });
  }

  validateUniqueLabels(bands: CapacityBand[]): void {
    const labels = bands.map((x) => x.label);
    expect(new Set(labels).size).toBe(labels.length);
  }

  validateRatedCapacity(data: CapacityGaugeData): void {
    if (data.ratedCapacityKva !== null) {
      expect(data.ratedCapacityKva).toBeGreaterThan(0);
    }
  }

  validateNaN(data: CapacityGaugeData): void {
    if (data.ratedCapacityKva !== null) {
      expect(Number.isNaN(data.ratedCapacityKva)).toBeFalsy();
      expect(Number.isFinite(data.ratedCapacityKva)).toBeTruthy();
    }
    data.bands.forEach((band) => {
      if (band.value !== null) {
        expect(Number.isNaN(band.value)).toBeFalsy();
      }
      if (band.percent !== null) {
        expect(Number.isNaN(band.percent)).toBeFalsy();
      }
    });
  }

  validateLiveOk(mapped: MappedDtrCapacityGauge): void {
    this.validateSuccess(mapped.success);
    this.validateFields(mapped);
    this.validateBandCount(mapped.bands);
    this.validateBandStructure(mapped.bands);
    this.validateBandOrder(mapped.bands);
    this.validateTypes(mapped);
    this.validateRatedCapacity(mapped);
    this.validateUnits(mapped.bands);
    this.validateNullableValues(mapped.bands);
    this.validateNullablePercentages(mapped.bands);
    this.validateCapacityLogic(mapped.ratedCapacityKva, mapped.bands);
    this.validateGaugePercentFormula(mapped.ratedCapacityKva, mapped.bands);
    this.validateNaN(mapped);
    this.validateUniqueLabels(mapped.bands);
  }

  validateAllNullContract(mapped: MappedDtrCapacityGauge): void {
    this.validateLiveOk(mapped);
    expect(mapped.ratedCapacityKva).toBeNull();
    mapped.bands.forEach((band) => {
      expect(band.value).toBeNull();
      expect(band.percent).toBeNull();
    });
  }

  validatePopulatedContract(mapped: MappedDtrCapacityGauge): void {
    this.validateLiveOk(mapped);
    expect(mapped.ratedCapacityKva).toBeNull();
    expect(findBand(mapped.bands, "Instant").value).toBe(45.67);
    expect(findBand(mapped.bands, "Daily").value).toBe(52.3);
    expect(findBand(mapped.bands, "Monthly").value).toBe(80);
    mapped.bands.forEach((band) => expect(band.percent).toBeNull());
  }

  validatePercentFormulaContract(mapped: MappedDtrCapacityGauge): void {
    this.validateLiveOk(mapped);
    const meta = dtrCapacityGaugeContractPercentFormulaMeta;
    expect(mapped.ratedCapacityKva).toBe(meta.ratedCapacityKva);

    expect(findBand(mapped.bands, "Instant").percent).toBe(
      meta.instant.expectedPercent,
    );
    expect(findBand(mapped.bands, "Daily").percent).toBe(
      meta.daily.expectedPercent,
    );
    expect(findBand(mapped.bands, "Monthly").percent).toBe(
      meta.monthly.expectedPercent,
    );

    expect(meta.instant.expectedPercent).toBe(
      backendGaugePercent(meta.instant.value, meta.ratedCapacityKva),
    );
    expect(meta.daily.expectedPercent).toBe(
      backendGaugePercent(meta.daily.value, meta.ratedCapacityKva),
    );
    expect(meta.monthly.expectedPercent).toBe(
      backendGaugePercent(meta.monthly.value, meta.ratedCapacityKva),
    );
  }

  validatePrimaryFallbackContract(mapped: MappedDtrCapacityGauge): void {
    this.validateLiveOk(mapped);
    expect(findBand(mapped.bands, "Instant").value).toBe(12.5);
    expect(findBand(mapped.bands, "Daily").value).toBe(15);
    expect(findBand(mapped.bands, "Monthly").value).toBeNull();
    expect(findBand(mapped.bands, "Yearly").value).toBeNull();
    expect(findBand(mapped.bands, "LifeTime").value).toBeNull();
  }

  validateScenario(
    mapped: MappedDtrCapacityGauge,
    scenario: DtrCapacityGaugeScenario,
  ): void {
    switch (scenario) {
      case "contract_all_null_bands":
        this.validateAllNullContract(mapped);
        break;
      case "contract_populated_bands":
        this.validatePopulatedContract(mapped);
        break;
      case "contract_gauge_percent_formula":
        this.validatePercentFormulaContract(mapped);
        break;
      case "contract_primary_fallback_zeros":
        this.validatePrimaryFallbackContract(mapped);
        break;
      case "dcg_by_code_primary":
      case "dcg_by_code_alt":
      case "dcg_ignore_unknown_query":
        this.validateLiveOk(mapped);
        break;
      default:
        break;
    }
  }
}
