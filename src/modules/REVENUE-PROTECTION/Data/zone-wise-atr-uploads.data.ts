import type {
  ZoneWiseAtrUploadStatus,
  ZoneWiseAtrUploadsQuery,
} from "../Mapper/zone-wise-atr-uploads.types";
import { REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";

export const zoneWiseAtrUploadsMaxResponseTimeMs = REVENUE_PROTECTION_MAX_RESPONSE_TIME_MS;

export const ZONE_WISE_ATR_UPLOADS_MONTH = 10;
export const ZONE_WISE_ATR_UPLOADS_YEAR = 2025;

/** UI status dropdown (screenshot) — exclude "--" empty option. */
export const ZONE_WISE_ATR_UPLOAD_STATUSES = [
  "PENDING_APPROVAL",
  "PROCESSING",
  "VALIDATION_FAILED",
  "COMPLETED",
  "PARTIALLY_COMPLETED",
  "FAILED",
  "CANCELLED",
] as const satisfies readonly ZoneWiseAtrUploadStatus[];

export interface ZoneWiseAtrUploadsTestCase {
  testCaseId: string;
  testName: string;
  tags: string[];
  query: ZoneWiseAtrUploadsQuery;
  nonEmptyExpected: boolean;
}

export const zoneWiseAtrUploadsTestCases: ZoneWiseAtrUploadsTestCase[] = [
  {
    testCaseId: "IND-REV-ZW-UPL-001",
    testName: `Fetch zone-wise ATR uploads — COMPLETED (${ZONE_WISE_ATR_UPLOADS_YEAR}-${String(ZONE_WISE_ATR_UPLOADS_MONTH).padStart(2, "0")})`,
    tags: [
      "@smoke",
      "@zone-wise-atr-uploads",
      "@revenue-protection",
      "@zone-wise-atr-uploads-COMPLETED",
    ],
    query: {
      month: ZONE_WISE_ATR_UPLOADS_MONTH,
      year: ZONE_WISE_ATR_UPLOADS_YEAR,
      status: "COMPLETED",
      page: 1,
      limit: 10,
    },
    nonEmptyExpected: true,
  },
];

export const zoneWiseAtrUploadsSummaryQuery = {
  month: ZONE_WISE_ATR_UPLOADS_MONTH,
  year: ZONE_WISE_ATR_UPLOADS_YEAR,
} as const;
