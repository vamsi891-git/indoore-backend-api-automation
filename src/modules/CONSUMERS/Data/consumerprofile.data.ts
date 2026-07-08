import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { ConsumerProfileScenario } from "../Mapper/consumerprofile.mapper";
import type { ConsumerProfileQuery } from "../Api/consumerprofile.api";

export const consumerProfileMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** Account / unique id used in user-provided profile sample. */
export const consumerProfileDefaultConsumerId = "5633025000";

/** IVRS (`RRNumber`) for the same consumer as the default account id. */
export const consumerProfileDefaultIvrs = "N3472031547";

/** Live meter lookup route that resolves a profile. */
export const consumerProfileDefaultMeterRoute = "meter-12345";

export const consumerProfileNotFoundRef = "INVALID_CONSUMER_XYZ";

export const consumerProfileMeterNotFoundRef = "meter-999999999";

export const consumerProfileDefaultQuery: ConsumerProfileQuery = {
  billingLimit: 12,
  eventPage: 1,
  eventPageSize: 20,
};

export interface ConsumerProfileTestCase {
  testName: string;
  scenario: ConsumerProfileScenario;
  expectedStatus?: number;
  tags: string[];
}

export function resolveConsumerProfileRef(
  scenario: ConsumerProfileScenario,
): string | undefined {
  switch (scenario) {
    case "profile_found":
    case "profile_no_query":
      return (
        process.env.CONSUMER_PROFILE_CONSUMER_ID?.trim() ||
        process.env.CONSUMER_ACTIVATION_CONSUMER_ID?.trim() ||
        consumerProfileDefaultConsumerId
      );
    case "profile_by_ivrs":
      return (
        process.env.CONSUMER_PROFILE_IVRS?.trim() || consumerProfileDefaultIvrs
      );
    case "profile_by_meter":
      return (
        process.env.CONSUMER_PROFILE_METER_ROUTE?.trim() ||
        consumerProfileDefaultMeterRoute
      );
    case "consumer_not_found":
      return consumerProfileNotFoundRef;
    case "meter_not_found":
      return consumerProfileMeterNotFoundRef;
    default:
      return undefined;
  }
}

export function resolveConsumerProfileQuery(
  scenario: ConsumerProfileScenario,
): ConsumerProfileQuery {
  if (scenario === "profile_no_query") {
    return {};
  }
  return { ...consumerProfileDefaultQuery };
}

export const consumerProfileTestCases: ConsumerProfileTestCase[] = [
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/profile — profile found with billing/event query",
    scenario: "profile_found",
    tags: ["@smoke", "@consumer", "@profile"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/profile — profile found without query params",
    scenario: "profile_no_query",
    tags: ["@consumer", "@profile", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{ivrs}/profile — resolve consumer by IVRS number",
    scenario: "profile_by_ivrs",
    tags: ["@consumer", "@profile", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/profile — resolve consumer by meter lookup id",
    scenario: "profile_by_meter",
    tags: ["@consumer", "@profile", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/consumers/{consumerId}/profile — consumer not found",
    scenario: "consumer_not_found",
    expectedStatus: 404,
    tags: ["@consumer", "@profile", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/consumers/meter-{id}/profile — unknown meter lookup id not found",
    scenario: "meter_not_found",
    expectedStatus: 404,
    tags: ["@consumer", "@profile", "@negative"],
  },
];
