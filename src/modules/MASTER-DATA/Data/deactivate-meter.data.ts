import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DeactivateMeterScenario } from "../Mapper/deactivate-meter.mapper";

export const deactivateMeterMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const deactivateMeterSuccessMessage = "Meter deactivated successfully";
export const deactivateMeterAlreadyInactiveMessage =
  "Meter is already inactive";

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
}

export const deactivateMeterTestCases: DeactivateMeterTestCase[] = [
  {
    testName:
      "Validate DELETE /indore/master-data/meters/:id — deactivate meter successfully",
    scenario: "success",
    expectedStatus: 200,
    provisionMeter: true,
    tags: ["@smoke", "@master-data", "@deactivate-meter", "@meter-master"],
  },
  {
    testName:
      "Validate DELETE /indore/master-data/meters/:id — already inactive is idempotent",
    scenario: "already_inactive",
    expectedStatus: 200,
    provisionMeter: true,
    deactivateTwice: true,
    tags: ["@master-data", "@deactivate-meter", "@meter-master"],
  },
  {
    testName:
      "Validate DELETE /indore/master-data/meters/:id — meter not found / out of scope",
    scenario: "not_found",
    expectedStatus: 404,
    provisionMeter: false,
    meterLookupTblRefId: 999_999_999,
    tags: ["@master-data", "@deactivate-meter", "@negative"],
  },
];
