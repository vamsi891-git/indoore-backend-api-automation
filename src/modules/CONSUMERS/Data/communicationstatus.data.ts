import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { CommunicationStatusQuery } from "../Api/communicationstatus.api";
import type {CommunicationStatusResponse,CommunicationStatusScenario,} from "../Mapper/communicationstatus.mapper";
import {
  CONSUMERS_LIVE_IVRS,
  CONSUMERS_LIVE_METER_ROUTE,
  resolveLiveIvrs,
  resolveLiveMeterRoute,
} from "./consumers-live-refs";
export const communicationStatusMaxResponseTimeMs =
  MASTER_DATA_MAX_RESPONSE_TIME_MS;
/** Same IVRS as power-quality / RTP live sample. */
export const communicationStatusDefaultIvrs = CONSUMERS_LIVE_IVRS;
export const communicationStatusDefaultConsumerId = CONSUMERS_LIVE_IVRS;
export const communicationStatusDefaultMeterRoute = CONSUMERS_LIVE_METER_ROUTE;
export const communicationStatusNotFoundRef = "INVALID_CONSUMER_XYZ";
export const communicationStatusMeterNotFoundRef = "meter-999999999";
export const communicationStatusEmptyRef = " ";
/** User-provided historical date with zero interval readings. */
export const communicationStatusSampleDate = "2026-06-22";
export const communicationStatusSampleDateDdMmYyyy = "22-06-2026";
export const EXPECTED_INTERVALS_PER_DAY = 96;
/** Shape A — zero readings (user sample + empty metrics). */
export const communicationStatusContractZeroResponse: CommunicationStatusResponse =
  {
    success: true,
    data: {
      date: "2026-06-22",
      intervals: {
        display: "00:00 (0%)",
        subtitle: "Intervals (0/96 Per Day)",
        receivedToday: 0,
        expectedPerDay: 96,
      },
      delayed: {
        display: "00:00",
        subtitle: "Delayed",
        delaySeconds: 0,
      },
    },
  };
/**
 * Shape B — readings present (backend buildConsumerCommunicationStatus).
 * percent / lastReadingToday / lastSeen appear only when metrics exist.
 */
export const communicationStatusContractWithReadingsResponse: CommunicationStatusResponse =
  {
    success: true,
    data: {
      date: "2026-06-22",
      latestReadingDateTime: "22 Jun 2026, 2:30 pm",
      intervals: {
        display: "14:30 (50%)",
        subtitle: "Intervals (48/96 Per Day)",
        receivedToday: 48,
        expectedPerDay: 96,
        percent: 50,
        lastReadingToday: "22 Jun 2026, 2:30 pm",
      },
      delayed: {
        display: "00:05",
        subtitle: "Delayed",
        delaySeconds: 300,
        lastSeen: "22 Jun 2026, 2:30 pm",
        previousReading: "22 Jun 2026, 2:10 pm",
      },
    },
  };
export interface CommunicationStatusTestCase {
  testName: string;
  scenario: CommunicationStatusScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
}
export function resolveCommunicationStatusRef(
  scenario: CommunicationStatusScenario,
): string | undefined {
  switch (scenario) {
    case "status_with_date":
    case "status_default_today":
    case "status_dd_mm_yyyy":
    case "invalid_date":
      return resolveLiveIvrs(
        process.env.CONSUMER_COMM_STATUS_IVRS,
        communicationStatusDefaultIvrs,
      );
    case "status_by_meter":
      return resolveLiveMeterRoute(
        process.env.CONSUMER_COMM_STATUS_METER_ROUTE,
        process.env.CONSUMER_PROFILE_METER_ROUTE,
        communicationStatusDefaultMeterRoute,
      );
    case "consumer_not_found":
      return communicationStatusNotFoundRef;
    case "meter_not_found":
      return communicationStatusMeterNotFoundRef;
    case "empty_consumer_ref":
      return communicationStatusEmptyRef;
    case "contract_zero_intervals":
    case "contract_with_readings":
      return undefined;
    default:
      return undefined;
  }
}
export function resolveCommunicationStatusQuery(
  scenario: CommunicationStatusScenario,
): CommunicationStatusQuery {
  switch (scenario) {
    case "status_with_date":
    case "status_by_meter":
    case "consumer_not_found":
    case "meter_not_found":
    case "empty_consumer_ref":
      return {
        date:
          process.env.CONSUMER_COMM_STATUS_DATE?.trim() ||
          communicationStatusSampleDate,
      };
    case "status_dd_mm_yyyy":
      return { date: communicationStatusSampleDateDdMmYyyy };
    case "status_default_today":
      return {};
    case "invalid_date":
      return { date: "not-a-date" };
    default:
      return {};
  }
}
export function resolveCommunicationStatusContractBody(
  scenario: CommunicationStatusScenario,
): CommunicationStatusResponse | undefined {
  switch (scenario) {
    case "contract_zero_intervals":
      return communicationStatusContractZeroResponse;
    case "contract_with_readings":
      return communicationStatusContractWithReadingsResponse;
    default:
      return undefined;
  }
}
export const communicationStatusTestCases: CommunicationStatusTestCase[] = [
  {
    testName:
      "Meter communication — status for a chosen date",
    scenario: "status_with_date",
    tags: ["@smoke", "@consumer", "@communication-status"],
  },
  {
    testName:
      "Meter communication — status for today when no date is given",
    scenario: "status_default_today",
    tags: ["@consumer", "@communication-status", "@edge"],
  },
  {
    testName:
      "Meter communication — wrong date format is rejected",
    scenario: "status_dd_mm_yyyy",
    expectedStatus: 400,
    tags: ["@consumer", "@communication-status", "@negative"],
  },
  {
    testName:
      "Meter communication — status opens using the meter",
    scenario: "status_by_meter",
    tags: ["@consumer", "@communication-status", "@edge"],
  },
  {
    testName:
      "Meter communication — sample: no readings for the day",
    scenario: "contract_zero_intervals",
    isContractFixture: true,
    tags: ["@consumer", "@communication-status", "@edge"],
  },
  {
    testName:
      "Meter communication — sample: readings received with delay",
    scenario: "contract_with_readings",
    isContractFixture: true,
    tags: ["@consumer", "@communication-status", "@edge"],
  },
  {
    testName:
      "Meter communication — invalid date is rejected",
    scenario: "invalid_date",
    expectedStatus: 400,
    tags: ["@consumer", "@communication-status", "@negative"],
  },
  {
    testName:
      "Meter communication — unknown consumer is not found",
    scenario: "consumer_not_found",
    expectedStatus: 404,
    tags: ["@consumer", "@communication-status", "@negative"],
  },
  {
    testName:
      "Meter communication — unknown meter shows empty or not found",
    scenario: "meter_not_found",
    tags: ["@consumer", "@communication-status", "@negative"],
  },
  {
    testName:
      "Meter communication — blank consumer number is rejected",
    scenario: "empty_consumer_ref",
    expectedStatus: 400,
    tags: ["@consumer", "@communication-status", "@negative"],
  },
];
