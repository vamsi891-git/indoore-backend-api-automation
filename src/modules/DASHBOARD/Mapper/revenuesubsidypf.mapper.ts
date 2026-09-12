/** Revenue / subsidy / PF amounts — GET|POST /indore/dashboard/revenue-subsidy-pf */

export type RevenueSubsidyPfScenario =
  | "dev_live_primary"
  | "dev_reject_unknown_query"
  | "dev_live_save_isolated"
  | "contract_live_sample"
  | "contract_zero_bills"
  | "contract_derived_fields"
  | "contract_save_zero_period";

export interface MeterCountAmount {
  meterCount: number;
  amount: number;
}

export interface EnergyLuAmount {
  energyLu: number;
  amount: number;
}

export interface RevenueGainedRpu {
  inputLu: number;
  rpu: number;
  amount: number;
}

export interface RevenueSubsidyPfData {
  id: string;
  periodYear: number;
  periodMonth: number;
  billingAvailability: MeterCountAmount;
  billingEfficiency: EnergyLuAmount;
  revenueGainedRpu: RevenueGainedRpu;
  subsidyAmount: number;
  incentivePf: MeterCountAmount;
  penaltyPf: MeterCountAmount;
  billCount: number;
  overallImprovement: number;
  overallImprovementCr: number;
  /** null when billCount is 0 (backend save/retrieve). */
  avgImprovement: number | null;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueSubsidyPfResponse {
  success: boolean;
  data?: RevenueSubsidyPfData | null;
  message?: string;
}

export interface RevenueSubsidyPfErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface MappedRevenueSubsidyPf {
  success: boolean;
  message?: string;
  /** False when GET returns data: null (no saved period). */
  hasRecord: boolean;
  data: RevenueSubsidyPfData;
}

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Preserve explicit null (billCount === 0 → avgImprovement null). */
function toNullableNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toStringValue(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  return String(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function mapMeterCountAmount(raw: unknown): MeterCountAmount {
  const row = asRecord(raw);
  return {
    meterCount: toNumber(row.meterCount),
    amount: toNumber(row.amount),
  };
}

function mapEnergyLuAmount(raw: unknown): EnergyLuAmount {
  const row = asRecord(raw);
  return {
    energyLu: toNumber(row.energyLu),
    amount: toNumber(row.amount),
  };
}

function mapRevenueGainedRpu(raw: unknown): RevenueGainedRpu {
  const row = asRecord(raw);
  return {
    inputLu: toNumber(row.inputLu),
    rpu: toNumber(row.rpu),
    amount: toNumber(row.amount),
  };
}

export class RevenueSubsidyPfMapper {
  static map(response: RevenueSubsidyPfResponse): MappedRevenueSubsidyPf {
    const hasRecord =
      response.data != null && typeof response.data === "object";
    const raw = asRecord(response.data);
    return {
      success: Boolean(response.success),
      message: response.message,
      hasRecord,
      data: {
        id: toStringValue(raw.id),
        periodYear: toNumber(raw.periodYear),
        periodMonth: toNumber(raw.periodMonth),
        billingAvailability: mapMeterCountAmount(raw.billingAvailability),
        billingEfficiency: mapEnergyLuAmount(raw.billingEfficiency),
        revenueGainedRpu: mapRevenueGainedRpu(raw.revenueGainedRpu),
        subsidyAmount: toNumber(raw.subsidyAmount),
        incentivePf: mapMeterCountAmount(raw.incentivePf),
        penaltyPf: mapMeterCountAmount(raw.penaltyPf),
        billCount: toNumber(raw.billCount),
        overallImprovement: toNumber(raw.overallImprovement),
        overallImprovementCr: toNumber(raw.overallImprovementCr),
        avgImprovement: toNullableNumber(raw.avgImprovement),
        createdByUserId: toStringValue(raw.createdByUserId),
        updatedByUserId: toStringValue(raw.updatedByUserId),
        createdAt: toStringValue(raw.createdAt),
        updatedAt: toStringValue(raw.updatedAt),
      },
    };
  }
}
