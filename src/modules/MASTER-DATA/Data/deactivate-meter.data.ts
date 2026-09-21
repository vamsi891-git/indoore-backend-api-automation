import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DeactivateMeterScenario } from "../Mapper/deactivate-meter.mapper";

export const deactivateMeterMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const deactivateMeterSuccessMessage = "Meter deactivated successfully";
export const deactivateMeterAlreadyInactiveMessage = "Meter is already inactive";

export interface DeactivateMeterTestCase {
  testName: string;
  scenario: DeactivateMeterScenario;
  expectedStatus: number;
  /** Create an active meter first, then DELETE it. */
  provisionMeter: boolean;
  /** Call DELETE twice (second call = already inactive). */
  deactivateTwice?: boolean;
  meterLookupTblRefId?: number;
  tags: string[];
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export const deactivateMeterTestCases: DeactivateMeterTestCase[] = [
  {
    testName: "Deactivate meter — meter is deactivated",
    scenario: "success",
    expectedStatus: 200,
    provisionMeter: true,
    tags: ["@smoke", "@master-data", "@deactivate-meter", "@meter-master"],
    nonEmptyExpected: true,
  },
  {
    testName: "Deactivate meter — deactivating an already inactive meter is allowed",
    scenario: "already_inactive",
    expectedStatus: 200,
    provisionMeter: true,
    deactivateTwice: true,
    tags: ["@master-data", "@deactivate-meter", "@meter-master"],
    nonEmptyExpected: false,
  },
  {
    testName: "Deactivate meter — unknown meter is rejected",
    scenario: "not_found",
    expectedStatus: 404,
    provisionMeter: false,
    meterLookupTblRefId: 999_999_999,
    tags: ["@master-data", "@deactivate-meter", "@negative"],
    nonEmptyExpected: false,
  },
];
