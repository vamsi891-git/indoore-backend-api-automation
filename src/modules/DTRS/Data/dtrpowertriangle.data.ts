import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrPowerTriangleQuery } from "../Api/dtrpowertriangle.api";
import type {
  DtrPowerTriangleErrorResponse,
  DtrPowerTriangleResponse,
  DtrPowerTriangleScenario,
} from "../Mapper/dtrpowertriangle.mapper";

export const dtrPowerTriangleMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** User-provided live DTR code (zeros or meter-data-unavailable). */
export const dtrPowerTriangleDefaultCode = "11IW3";

export const dtrPowerTriangleAltCode = "34SO21";

export const dtrPowerTriangleNotFoundCode = "INVALID_DTR_XYZ";

export const dtrPowerTriangleEmptyCode = " ";

export const dtrPowerTriangleRequiredFields = [
  "activePowerKw",
  "reactivePowerKvar",
  "apparentPowerKva",
  "powerFactor",
] as const;

/** Live sample for 11IW3 — API coerces missing IP to zeros. */
export const dtrPowerTriangleContractAllZeroResponse: DtrPowerTriangleResponse = {
  success: true,
  data: {
    activePowerKw: 0,
    reactivePowerKvar: 0,
    apparentPowerKva: 0,
    powerFactor: 0,
  },
};

/** Backend `loadDtrPowerTriangleByCode` when no SP/TP IP row exists. */
export const dtrPowerTriangleContractAllNullResponse: DtrPowerTriangleResponse = {
  success: true,
  data: {
    activePowerKw: null,
    reactivePowerKvar: null,
    apparentPowerKva: null,
    powerFactor: null,
  },
};

/** SP IP — composePowerTriangleFromSpIp with PF column. */
export const dtrPowerTriangleContractSpResponse: DtrPowerTriangleResponse = {
  success: true,
  data: {
    activePowerKw: 25.5,
    reactivePowerKvar: 15.8,
    apparentPowerKva: 30,
    powerFactor: 0.85,
  },
};

/** TP IP — reactive from meter kvar column. */
export const dtrPowerTriangleContractTpResponse: DtrPowerTriangleResponse = {
  success: true,
  data: {
    activePowerKw: 40,
    reactivePowerKvar: 21.2,
    apparentPowerKva: 50,
    powerFactor: 0.92,
  },
};

/**
 * Reactive derived via PF: Q = |kVA| × √(1 − PF²).
 * kW 20, kVA 25, PF 0.8 → Q ≈ 15.
 */
export const dtrPowerTriangleContractReactivePfMeta = {
  activePowerKw: 20,
  apparentPowerKva: 25,
  powerFactor: 0.8,
  expectedReactiveKvar: 15,
};

export const dtrPowerTriangleContractReactivePfResponse: DtrPowerTriangleResponse =
  {
    success: true,
    data: {
      activePowerKw: dtrPowerTriangleContractReactivePfMeta.activePowerKw,
      reactivePowerKvar: null,
      apparentPowerKva: dtrPowerTriangleContractReactivePfMeta.apparentPowerKva,
      powerFactor: dtrPowerTriangleContractReactivePfMeta.powerFactor,
    },
  };

/**
 * Reactive derived via triangle: Q = √(kVA² − kW²).
 * kW 30, kVA 50 → Q = 40.
 */
export const dtrPowerTriangleContractReactiveTriangleMeta = {
  activePowerKw: 30,
  apparentPowerKva: 50,
  expectedReactiveKvar: 40,
};

export const dtrPowerTriangleContractReactiveTriangleResponse: DtrPowerTriangleResponse =
  {
    success: true,
    data: {
      activePowerKw: dtrPowerTriangleContractReactiveTriangleMeta.activePowerKw,
      reactivePowerKvar: null,
      apparentPowerKva:
        dtrPowerTriangleContractReactiveTriangleMeta.apparentPowerKva,
      powerFactor: null,
    },
  };

/** API error when no meter reading is available for the widget. */
export const dtrPowerTriangleContractUnavailableError: DtrPowerTriangleErrorResponse =
  {
    success: false,
    error: {
      code: "DTR_METER_DATA_UNAVAILABLE",
      message: "No meter reading available for power triangle",
    },
  };

export interface DtrPowerTriangleTestCase {
  testName: string;
  scenario: DtrPowerTriangleScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
}

export function resolveDtrPowerTriangleCode(
  scenario: DtrPowerTriangleScenario,
): string | undefined {
  switch (scenario) {
    case "dpt_by_code_primary":
    case "dpt_ignore_unknown_query":
      return (
        process.env.DTR_POWER_TRIANGLE_CODE?.trim() ||
        process.env.DTR_CAPACITY_GAUGE_CODE?.trim() ||
        dtrPowerTriangleDefaultCode
      );
    case "dpt_by_code_alt":
      return (
        process.env.DTR_POWER_TRIANGLE_CODE_ALT?.trim() ||
        process.env.DTR_CAPACITY_GAUGE_CODE_ALT?.trim() ||
        dtrPowerTriangleAltCode
      );
    case "dtr_not_found":
      return dtrPowerTriangleNotFoundCode;
    case "empty_dtr_code":
      return dtrPowerTriangleEmptyCode;
    case "contract_all_zero_degraded":
    case "contract_all_null_backend":
    case "contract_sp_instantaneous":
    case "contract_tp_instantaneous":
    case "contract_reactive_from_pf":
    case "contract_reactive_from_triangle":
    case "contract_meter_data_unavailable":
      return undefined;
    default:
      return undefined;
  }
}

export function resolveDtrPowerTriangleQuery(
  scenario: DtrPowerTriangleScenario,
): DtrPowerTriangleQuery {
  if (scenario === "dpt_ignore_unknown_query") {
    return { foo: 1, bar: "baz" };
  }
  return {};
}

export function resolveDtrPowerTriangleContractBody(
  scenario: DtrPowerTriangleScenario,
): DtrPowerTriangleResponse | DtrPowerTriangleErrorResponse | undefined {
  switch (scenario) {
    case "contract_all_zero_degraded":
      return dtrPowerTriangleContractAllZeroResponse;
    case "contract_all_null_backend":
      return dtrPowerTriangleContractAllNullResponse;
    case "contract_sp_instantaneous":
      return dtrPowerTriangleContractSpResponse;
    case "contract_tp_instantaneous":
      return dtrPowerTriangleContractTpResponse;
    case "contract_reactive_from_pf":
      return dtrPowerTriangleContractReactivePfResponse;
    case "contract_reactive_from_triangle":
      return dtrPowerTriangleContractReactiveTriangleResponse;
    case "contract_meter_data_unavailable":
      return dtrPowerTriangleContractUnavailableError;
    default:
      return undefined;
  }
}

/** @deprecated Use resolveDtrPowerTriangleCode — kept for backward compatibility. */
export const dtrPowerTriangleData = {
  dtrCode: dtrPowerTriangleDefaultCode,
  maxResponseTime: dtrPowerTriangleMaxResponseTimeMs,
  requiredFields: dtrPowerTriangleRequiredFields,
};

export const dtrPowerTriangleTestCases: DtrPowerTriangleTestCase[] = [
  {
    testName:
      "Validate GET /indore/dtr/{code}/power-triangle — primary DTR (11IW3) instantaneous power",
    scenario: "dpt_by_code_primary",
    tags: ["@smoke", "@dtr", "@power-triangle"],
  },
  {
    testName:
      "Validate GET /indore/dtr/{code}/power-triangle — alternate DTR code",
    scenario: "dpt_by_code_alt",
    tags: ["@dtr", "@power-triangle", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/dtr/{code}/power-triangle — unknown query params ignored",
    scenario: "dpt_ignore_unknown_query",
    tags: ["@dtr", "@power-triangle", "@edge"],
  },
  {
    testName:
      "Contract — all-zero degraded payload when no IP reading (11IW3 live shape)",
    scenario: "contract_all_zero_degraded",
    isContractFixture: true,
    tags: ["@dtr", "@power-triangle", "@edge"],
  },
  {
    testName:
      "Contract — all-null backend shape when SP/TP IP unavailable",
    scenario: "contract_all_null_backend",
    isContractFixture: true,
    tags: ["@dtr", "@power-triangle", "@edge"],
  },
  {
    testName:
      "Contract — SP instantaneous IP (kW, kVA, PF, derived kVAr)",
    scenario: "contract_sp_instantaneous",
    isContractFixture: true,
    tags: ["@dtr", "@power-triangle", "@edge"],
  },
  {
    testName:
      "Contract — TP instantaneous IP with meter kvar column",
    scenario: "contract_tp_instantaneous",
    isContractFixture: true,
    tags: ["@dtr", "@power-triangle", "@edge"],
  },
  {
    testName:
      "Contract — reactive kVAr derived from PF (Q = |kVA| × √(1 − PF²))",
    scenario: "contract_reactive_from_pf",
    isContractFixture: true,
    tags: ["@dtr", "@power-triangle", "@edge"],
  },
  {
    testName:
      "Contract — reactive kVAr derived from triangle (Q = √(kVA² − kW²))",
    scenario: "contract_reactive_from_triangle",
    isContractFixture: true,
    tags: ["@dtr", "@power-triangle", "@edge"],
  },
  {
    testName:
      "Contract — DTR_METER_DATA_UNAVAILABLE when no meter reading",
    scenario: "contract_meter_data_unavailable",
    isContractFixture: true,
    tags: ["@dtr", "@power-triangle", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/dtr/{code}/power-triangle — DTR not found",
    scenario: "dtr_not_found",
    tags: ["@dtr", "@power-triangle", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/dtr/{code}/power-triangle — blank DTR code rejected",
    scenario: "empty_dtr_code",
    expectedStatus: 400,
    tags: ["@dtr", "@power-triangle", "@negative"],
  },
];
