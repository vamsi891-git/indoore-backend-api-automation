import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { DtrProfileQuery } from "../Api/dtrprofile.api";
import type {
  DtrProfileResponse,
  DtrProfileScenario,
} from "../Mapper/dtrprofile.mapper";

export const dtrProfileMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

/** User-provided live DTR code. */
export const dtrProfileDefaultCode = "11IW3";

export const dtrProfileAltCode = "34SO21";

export const dtrProfileNotFoundCode = "INVALID_DTR_XYZ";

export const dtrProfileEmptyCode = " ";

export const dtrProfileExpectedTitles = [
  "DTR No",
  "DTR Name",
  "Circle",
  "Division",
  "Zone",
  "Sub Station",
  "Feeder",
  "Capacity",
  "Meter SL No",
  "MF",
  "Permanent Address",
  "Latitude",
  "Longitude",
] as const;

export const dtrProfileFieldCount = 13;

export const dtrProfileMaxActivities = 5;

export const dtrProfileActivityLookbackDays = 180;

export const dtrProfileDefaultActivityTitle = "Meter event";

/** Live sample for GET /indore/dtr/11IW3/profile. */
export const dtrProfileContractLive11Iw3Response: DtrProfileResponse = {
  success: true,
  data: {
    profileInformation: [
      { title: "DTR No", value: "11IW3" },
      { title: "DTR Name", value: "11IW3" },
      { title: "Circle", value: "Indore city circle" },
      { title: "Division", value: "WEST" },
      { title: "Zone", value: "GPH" },
      { title: "Sub Station", value: "Citi Control Room" },
      { title: "Feeder", value: "SHIV VILLAS PALA.(CHQ)" },
      { title: "Capacity", value: null },
      { title: "Meter SL No", value: "19272307" },
      { title: "MF", value: "60" },
      { title: "Permanent Address", value: "11IW3" },
      { title: "Latitude", value: null },
      { title: "Longitude", value: null },
    ],
    hierarchy: [
      { title: "Sub Station", value: "Citi Control Room" },
      { title: "Feeder", value: "SHIV VILLAS PALA.(CHQ)" },
      { title: "DTR", value: "11IW3" },
    ],
    latestActivities: [],
  },
};

/** getDtrRatedCapacityKva unavailable — Capacity/Lat/Lon null. */
export const dtrProfileContractNullOptionalResponse: DtrProfileResponse = {
  success: true,
  data: {
    profileInformation: [
      { title: "DTR No", value: "TEST01" },
      { title: "DTR Name", value: "Test DTR" },
      { title: "Circle", value: "Circle A" },
      { title: "Division", value: "Division B" },
      { title: "Zone", value: "Zone C" },
      { title: "Sub Station", value: "Sub Station X" },
      { title: "Feeder", value: "Feeder Y" },
      { title: "Capacity", value: null },
      { title: "Meter SL No", value: "12345678" },
      { title: "MF", value: "1" },
      { title: "Permanent Address", value: "Test Address" },
      { title: "Latitude", value: null },
      { title: "Longitude", value: null },
    ],
    hierarchy: [
      { title: "Sub Station", value: "Sub Station X" },
      { title: "Feeder", value: "Feeder Y" },
      { title: "DTR", value: "Test DTR" },
    ],
    latestActivities: [],
  },
};

/** fetchLatestActivitiesCapped — archive timeout or no events. */
export const dtrProfileContractEmptyActivitiesResponse: DtrProfileResponse = {
  success: true,
  data: {
    profileInformation: dtrProfileContractLive11Iw3Response.data!
      .profileInformation,
    hierarchy: dtrProfileContractLive11Iw3Response.data!.hierarchy,
    latestActivities: [],
  },
};

/** fetchLatestActivities — LIMIT 5, IST timestamps, default title fallback. */
export const dtrProfileContractWithActivitiesResponse: DtrProfileResponse = {
  success: true,
  data: {
    profileInformation: dtrProfileContractLive11Iw3Response.data!
      .profileInformation,
    hierarchy: dtrProfileContractLive11Iw3Response.data!.hierarchy,
    latestActivities: [
      {
        title: "Power failure",
        timestamp: "09-07-2026 14:30:15",
      },
      {
        title: dtrProfileDefaultActivityTitle,
        timestamp: "08-07-2026 09:15:00",
      },
    ],
  },
};

/** capacityKva != null → "{n} kVA" string. */
export const dtrProfileContractCapacityKvaResponse: DtrProfileResponse = {
  success: true,
  data: {
    profileInformation: [
      { title: "DTR No", value: "CAP01" },
      { title: "DTR Name", value: "Capacity DTR" },
      { title: "Circle", value: "Circle" },
      { title: "Division", value: "Division" },
      { title: "Zone", value: "Zone" },
      { title: "Sub Station", value: "SS" },
      { title: "Feeder", value: "Feeder" },
      { title: "Capacity", value: "250 kVA" },
      { title: "Meter SL No", value: "99887766" },
      { title: "MF", value: "40" },
      { title: "Permanent Address", value: "Addr" },
      { title: "Latitude", value: "22.7196" },
      { title: "Longitude", value: "75.8577" },
    ],
    hierarchy: [
      { title: "Sub Station", value: "SS" },
      { title: "Feeder", value: "Feeder" },
      { title: "DTR", value: "Capacity DTR" },
    ],
    latestActivities: [],
  },
};

/** Recursive anc depth DESC — root → … → DTR. */
export const dtrProfileContractDeepHierarchyResponse: DtrProfileResponse = {
  success: true,
  data: {
    profileInformation: dtrProfileContractCapacityKvaResponse.data!
      .profileInformation,
    hierarchy: [
      { title: "Circle", value: "Indore city circle" },
      { title: "Division", value: "WEST" },
      { title: "Zone", value: "GPH" },
      { title: "Sub Station", value: "SS" },
      { title: "Feeder", value: "Feeder" },
      { title: "DTR", value: "Capacity DTR" },
    ],
    latestActivities: [],
  },
};

export interface DtrProfileTestCase {
  testName: string;
  scenario: DtrProfileScenario;
  expectedStatus?: number;
  isContractFixture?: boolean;
  tags: string[];
}

export function resolveDtrProfileCode(
  scenario: DtrProfileScenario,
): string | undefined {
  switch (scenario) {
    case "dpr_by_code_primary":
    case "dpr_ignore_unknown_query":
      return (
        process.env.DTR_PROFILE_CODE?.trim() ||
        process.env.DTR_POWER_TRIANGLE_CODE?.trim() ||
        process.env.DTR_CAPACITY_GAUGE_CODE?.trim() ||
        dtrProfileDefaultCode
      );
    case "dpr_by_code_alt":
      return (
        process.env.DTR_PROFILE_CODE_ALT?.trim() ||
        process.env.DTR_POWER_TRIANGLE_CODE_ALT?.trim() ||
        process.env.DTR_CAPACITY_GAUGE_CODE_ALT?.trim() ||
        dtrProfileAltCode
      );
    case "dtr_not_found":
      return dtrProfileNotFoundCode;
    case "empty_dtr_code":
      return dtrProfileEmptyCode;
    case "contract_live_11iw3":
    case "contract_null_optional_fields":
    case "contract_empty_activities":
    case "contract_with_activities":
    case "contract_capacity_kva":
    case "contract_deep_hierarchy":
      return undefined;
    default:
      return undefined;
  }
}

export function resolveDtrProfileQuery(
  scenario: DtrProfileScenario,
): DtrProfileQuery {
  if (scenario === "dpr_ignore_unknown_query") {
    return { foo: 1, bar: "baz" };
  }
  return {};
}

export function resolveDtrProfileContractBody(
  scenario: DtrProfileScenario,
): DtrProfileResponse | undefined {
  switch (scenario) {
    case "contract_live_11iw3":
      return dtrProfileContractLive11Iw3Response;
    case "contract_null_optional_fields":
      return dtrProfileContractNullOptionalResponse;
    case "contract_empty_activities":
      return dtrProfileContractEmptyActivitiesResponse;
    case "contract_with_activities":
      return dtrProfileContractWithActivitiesResponse;
    case "contract_capacity_kva":
      return dtrProfileContractCapacityKvaResponse;
    case "contract_deep_hierarchy":
      return dtrProfileContractDeepHierarchyResponse;
    default:
      return undefined;
  }
}

/** @deprecated Use resolveDtrProfileCode — kept for backward compatibility. */
export const dtrProfileData = {
  dtrCode: dtrProfileDefaultCode,
  expectedProfileTitles: dtrProfileExpectedTitles,
  profileFieldCount: dtrProfileFieldCount,
  maxActivities: dtrProfileMaxActivities,
  activityLookbackDays: dtrProfileActivityLookbackDays,
  defaultActivityTitle: dtrProfileDefaultActivityTitle,
};

export const dtrProfileTestCases: DtrProfileTestCase[] = [
  {
    testName:
      "Validate GET /indore/dtr/{code}/profile — primary DTR (11IW3) profile",
    scenario: "dpr_by_code_primary",
    tags: ["@smoke", "@dtr", "@profile"],
  },
  {
    testName: "Validate GET /indore/dtr/{code}/profile — alternate DTR code",
    scenario: "dpr_by_code_alt",
    tags: ["@dtr", "@profile", "@edge"],
  },
  {
    testName:
      "Validate GET /indore/dtr/{code}/profile — unknown query params ignored",
    scenario: "dpr_ignore_unknown_query",
    tags: ["@dtr", "@profile", "@edge"],
  },
  {
    testName: "Contract — live 11IW3 profile shape (profile + hierarchy)",
    scenario: "contract_live_11iw3",
    isContractFixture: true,
    tags: ["@dtr", "@profile", "@edge"],
  },
  {
    testName:
      "Contract — null Capacity/Latitude/Longitude when rated capacity unavailable",
    scenario: "contract_null_optional_fields",
    isContractFixture: true,
    tags: ["@dtr", "@profile", "@edge"],
  },
  {
    testName:
      "Contract — empty latestActivities (archive timeout or no events)",
    scenario: "contract_empty_activities",
    isContractFixture: true,
    tags: ["@dtr", "@profile", "@edge"],
  },
  {
    testName:
      "Contract — latestActivities with alarm title and Meter event fallback",
    scenario: "contract_with_activities",
    isContractFixture: true,
    tags: ["@dtr", "@profile", "@edge"],
  },
  {
    testName: "Contract — Capacity formatted as \"{n} kVA\" with coordinates",
    scenario: "contract_capacity_kva",
    isContractFixture: true,
    tags: ["@dtr", "@profile", "@edge"],
  },
  {
    testName:
      "Contract — hierarchy depth DESC (root → … → DTR last)",
    scenario: "contract_deep_hierarchy",
    isContractFixture: true,
    tags: ["@dtr", "@profile", "@edge"],
  },
  {
    testName: "Validate GET /indore/dtr/{code}/profile — DTR not found",
    scenario: "dtr_not_found",
    tags: ["@dtr", "@profile", "@negative"],
  },
  {
    testName:
      "Validate GET /indore/dtr/{code}/profile — blank DTR code rejected",
    scenario: "empty_dtr_code",
    expectedStatus: 400,
    tags: ["@dtr", "@profile", "@negative"],
  },
];
