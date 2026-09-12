import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { MinMaxVoltageCountQuery as MinMaxVoltageCountApiQuery } from "../Api/minmaxvoltagecount.api";
import type {
  MinMaxVoltageCountResponse,
  MinMaxVoltageCountScenario,
} from "../Mapper/minmaxvoltagecount.mapper";
import {
  minMaxVoltageDefaultMeterPhaseTblRefId,
  minMaxVoltageDefaultMonth,
  minMaxVoltageDefaultPhase,
  minMaxVoltageDefaultVoltageType,
  minMaxVoltageDefaultYear,
} from "./minmaxvoltage.data";

export type MinMaxVoltageCountQuery = MinMaxVoltageCountApiQuery & {
  foo?: string;
  unused?: number;
};

export const minMaxVoltageCountMaxResponseTimeMs =
  MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const minMaxVoltageCountDefaultMeterPhaseTblRefId =
  minMaxVoltageDefaultMeterPhaseTblRefId;
export const minMaxVoltageCountDefaultMonth = minMaxVoltageDefaultMonth;
export const minMaxVoltageCountDefaultYear = minMaxVoltageDefaultYear;
export const minMaxVoltageCountDefaultVoltageType =
  minMaxVoltageDefaultVoltageType;
export const minMaxVoltageCountDefaultPhase = minMaxVoltageDefaultPhase;

function primaryQuery(
  overrides: Partial<MinMaxVoltageCountQuery> = {},
): MinMaxVoltageCountQuery {
  return {
    meterPhaseTblRefId: minMaxVoltageCountDefaultMeterPhaseTblRefId,
    month: minMaxVoltageCountDefaultMonth,
    year: minMaxVoltageCountDefaultYear,
    voltageType: minMaxVoltageCountDefaultVoltageType,
    phase: minMaxVoltageCountDefaultPhase,
    ...overrides,
  };
}

export const minMaxVoltageCountContractLiveResponse: MinMaxVoltageCountResponse =
  {
    success: true,
    data: {
      total: 10,
      totalIsExact: true,
    },
  };

export const minMaxVoltageCountContractEmptyResponse: MinMaxVoltageCountResponse =
  {
    success: true,
    data: {
      total: 0,
      totalIsExact: true,
    },
  };

export interface MinMaxVoltageCountTestCase {
  testName: string;
  scenario: MinMaxVoltageCountScenario;
  tags: string[];
  isContractFixture?: boolean;
  expectedStatus?: number;
}

/** Live voltageType × phase matrix (Oct 2025, meterPhaseTblRefId=3). */
export const minMaxVoltageCountLiveMatrix: Array<{
  scenario: Extract<
    MinMaxVoltageCountScenario,
    | "dev_live_primary"
    | "dev_live_min_y"
    | "dev_live_min_b"
    | "dev_live_max_r"
    | "dev_live_max_y"
    | "dev_live_max_b"
  >;
  voltageType: "min" | "max";
  phase: "R" | "Y" | "B";
  label: string;
}> = [
  {
    scenario: "dev_live_primary",
    voltageType: "min",
    phase: "R",
    label: "min R",
  },
  {
    scenario: "dev_live_min_y",
    voltageType: "min",
    phase: "Y",
    label: "min Y",
  },
  {
    scenario: "dev_live_min_b",
    voltageType: "min",
    phase: "B",
    label: "min B",
  },
  {
    scenario: "dev_live_max_r",
    voltageType: "max",
    phase: "R",
    label: "max R",
  },
  {
    scenario: "dev_live_max_y",
    voltageType: "max",
    phase: "Y",
    label: "max Y",
  },
  {
    scenario: "dev_live_max_b",
    voltageType: "max",
    phase: "B",
    label: "max B",
  },
];

export function resolveMinMaxVoltageCountQuery(
  scenario: MinMaxVoltageCountScenario,
): MinMaxVoltageCountQuery {
  const matrix = minMaxVoltageCountLiveMatrix.find(
    (m) => m.scenario === scenario,
  );
  if (matrix) {
    return primaryQuery({
      voltageType: matrix.voltageType,
      phase: matrix.phase,
    });
  }

  switch (scenario) {
    case "dev_ignore_unknown_query":
      return primaryQuery({ foo: "bar", unused: 1 });
    case "dev_ignore_page_limit":
      return primaryQuery({ page: 99, limit: 1 });
    case "dev_empty_window":
      return primaryQuery({ month: 1, year: 2099 });
    case "invalid_voltage_type":
      return primaryQuery({ voltageType: "peak" });
    case "invalid_phase":
      return primaryQuery({ phase: "X" });
    case "invalid_month":
      return primaryQuery({ month: 13 });
    case "invalid_year":
      return primaryQuery({ year: 0 });
    case "missing_year":
      return primaryQuery({ year: undefined });
    case "missing_month":
      return primaryQuery({ month: undefined });
    case "missing_meter_phase":
      return primaryQuery({ meterPhaseTblRefId: undefined });
    case "contract_live_full":
    case "contract_empty":
    default:
      return primaryQuery();
  }
}

export function resolveMinMaxVoltageCountContractBody(
  scenario: MinMaxVoltageCountScenario,
): MinMaxVoltageCountResponse | undefined {
  switch (scenario) {
    case "contract_live_full":
      return minMaxVoltageCountContractLiveResponse;
    case "contract_empty":
      return minMaxVoltageCountContractEmptyResponse;
    default:
      return undefined;
  }
}

export const minMaxVoltageCountTestCases: MinMaxVoltageCountTestCase[] = [
  ...minMaxVoltageCountLiveMatrix.map((m) => ({
    testName: `Min-max voltage count — Oct 2025 ${m.label} returns a total`,
    scenario: m.scenario,
    tags:
      m.scenario === "dev_live_primary"
        ? (["@smoke", "@reports", "@min-max-voltage-count"] as string[])
        : (["@reports", "@min-max-voltage-count", "@matrix"] as string[]),
  })),
  {
    testName: "Min-max voltage count — unknown query params are ignored",
    scenario: "dev_ignore_unknown_query",
    tags: ["@reports", "@min-max-voltage-count", "@edge"],
  },
  {
    testName:
      "Min-max voltage count — page and limit do not change the total",
    scenario: "dev_ignore_page_limit",
    tags: ["@reports", "@min-max-voltage-count", "@edge"],
  },
  {
    testName:
      "Min-max voltage count — a month with no readings still returns 200",
    scenario: "dev_empty_window",
    tags: ["@reports", "@min-max-voltage-count", "@edge"],
  },
  {
    testName: "Min-max voltage count — Oct 2025 min R fixture",
    scenario: "contract_live_full",
    isContractFixture: true,
    tags: ["@reports", "@min-max-voltage-count", "@edge"],
  },
  {
    testName: "Min-max voltage count — zero total fixture",
    scenario: "contract_empty",
    isContractFixture: true,
    tags: ["@reports", "@min-max-voltage-count", "@edge"],
  },
  {
    testName: "Min-max voltage count — invalid voltageType is rejected",
    scenario: "invalid_voltage_type",
    expectedStatus: 400,
    tags: ["@reports", "@min-max-voltage-count", "@negative"],
  },
  {
    testName: "Min-max voltage count — invalid phase is rejected",
    scenario: "invalid_phase",
    expectedStatus: 400,
    tags: ["@reports", "@min-max-voltage-count", "@negative"],
  },
  {
    testName: "Min-max voltage count — invalid month is rejected",
    scenario: "invalid_month",
    expectedStatus: 400,
    tags: ["@reports", "@min-max-voltage-count", "@negative"],
  },
  {
    testName: "Min-max voltage count — invalid year is rejected",
    scenario: "invalid_year",
    expectedStatus: 400,
    tags: ["@reports", "@min-max-voltage-count", "@negative"],
  },
  {
    testName: "Min-max voltage count — missing year is rejected",
    scenario: "missing_year",
    expectedStatus: 400,
    tags: ["@reports", "@min-max-voltage-count", "@negative"],
  },
  {
    testName: "Min-max voltage count — missing month is rejected",
    scenario: "missing_month",
    expectedStatus: 400,
    tags: ["@reports", "@min-max-voltage-count", "@negative"],
  },
  {
    testName: "Min-max voltage count — missing meterPhaseTblRefId is rejected",
    scenario: "missing_meter_phase",
    expectedStatus: 400,
    tags: ["@reports", "@min-max-voltage-count", "@negative"],
  },
];
