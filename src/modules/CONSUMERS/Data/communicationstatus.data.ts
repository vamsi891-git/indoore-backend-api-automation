import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { CommunicationStatusQuery } from "../Api/communicationstatus.api";
import type {
  CommunicationStatusResponse,
  CommunicationStatusScenario,
} from "../Mapper/communicationstatus.mapper";

export const communicationStatusMaxResponseTimeMs =
  MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** Same IVRS as power-quality (1 PH / SP). */
export const communicationStatusDefaultIvrs = "N3471011444";

export const communicationStatusDefaultConsumerId = "N3471011444";

export const communicationStatusDefaultMeterRoute = "meter-12345";

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
      return (
        process.env.CONSUMER_COMM_STATUS_IVRS?.trim() ||
        process.env.CONSUMER_PQ_IVRS?.trim() ||
        communicationStatusDefaultIvrs
      );
    case "status_by_meter":
      return (
        process.env.CONSUMER_COMM_STATUS_METER_ROUTE?.trim() ||
        process.env.CONSUMER_PQ_METER_ROUTE?.trim() ||
        process.env.CONSUMER_PROFILE_METER_ROUTE?.trim() ||
        communicationStatusDefaultMeterRoute
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
      "Validate GET /indore/consumers/{ivrs}/communication-status — status for explicit date",
    scenario: "status_with_date",
    tags: ["@smoke", "@consumer", "@communication-status"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/communication-status — default date is IST today",
    scenario: "status_default_today",
    tags: ["@consumer", "@communication-status", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/communication-status — accept DD-MM-YYYY date",
    scenario: "status_dd_mm_yyyy",
    tags: ["@consumer", "@communication-status", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/communication-status — resolve by meter lookup",
    scenario: "status_by_meter",
    tags: ["@consumer", "@communication-status", "@edge"],
  },
  {
    testName:
      "Contract — zero intervals (0/96) display and delayed 00:00",
    scenario: "contract_zero_intervals",
    isContractFixture: true,
    tags: ["@consumer", "@communication-status", "@edge"],
  },
  {
    testName:
      "Contract — readings present with percent, lastSeen, and delaySeconds",
    scenario: "contract_with_readings",
    isContractFixture: true,
    tags: ["@consumer", "@communication-status", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/communication-status — invalid date rejected",
    scenario: "invalid_date",
    expectedStatus: 400,
    tags: ["@consumer", "@communication-status", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/communication-status — consumer not found",
    scenario: "consumer_not_found",
    expectedStatus: 404,
    tags: ["@consumer", "@communication-status", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/communication-status — unknown meter not found or empty status",
    scenario: "meter_not_found",
    tags: ["@consumer", "@communication-status", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ref}/communication-status — blank consumer ref rejected",
    scenario: "empty_consumer_ref",
    expectedStatus: 400,
    tags: ["@consumer", "@communication-status", "@negative"],
  },
];
