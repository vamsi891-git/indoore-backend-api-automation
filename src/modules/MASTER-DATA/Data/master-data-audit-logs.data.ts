import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { MasterDataAuditLogsQuery } from "../Mapper/master-data-audit-logs.mapper";

/**
 * Exact audit `action` values owned by master-data (mirrors backend
 * MASTER_DATA_AUDIT_ACTIONS). Excludes user/auth/rbac codes.
 */
export const MASTER_DATA_AUDIT_ACTIONS = [
  "consumer.created",
  "consumer.updated",
  "consumer.deleted",
  "consumer.bulk_created",
  "consumer.activation_change",
  "dtr.created",
  "dtr.updated",
  "dtr.deleted",
  "dtr.bulk_created",
  "meter.created",
  "meter.updated",
  "meter.deleted",
  "meter.bulk_created",
  "master_data.upload.validated",
  "master_data.upload.approved",
  "master_data.upload.rejected",
] as const;

export type MasterDataAuditAction = (typeof MASTER_DATA_AUDIT_ACTIONS)[number];

/** Slim details keys kept by projectMasterDataAuditDetails. */
export const MASTER_DATA_AUDIT_DETAIL_KEYS = [
  "action",
  "module",
  "entityId",
  "entityType",
  "entityLabel",
  "isBulk",
  "changes",
  "meterSerialNumber",
  "meterSerialNumbers",
  "consumerCid",
  "ivrsNumber",
  "conflictMode",
  "createdCount",
  "updatedCount",
] as const;

export const masterDataAuditLogsMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const masterDataAuditLogsDefaultQuery = {
  page: 1,
  limit: 20,
  sort: "createdAt_desc",
} as const satisfies MasterDataAuditLogsQuery;

export const masterDataAuditLogsAscQuery = {
  page: 1,
  limit: 20,
  sort: "createdAt_asc",
} as const satisfies MasterDataAuditLogsQuery;

/** One row per page so a second page exists when there are at least two changes. */
export const masterDataAuditLogsPage2Query = {
  page: 2,
  limit: 1,
  sort: "createdAt_desc",
} as const satisfies MasterDataAuditLogsQuery;

export const masterDataAuditLogsSmallPageQuery = {
  page: 1,
  limit: 10,
  sort: "createdAt_desc",
} as const satisfies MasterDataAuditLogsQuery;

export const masterDataAuditLogsMeterCreatedQuery = {
  page: 1,
  limit: 20,
  sort: "createdAt_desc",
  action: "meter.created",
} as const satisfies MasterDataAuditLogsQuery;

export const masterDataAuditLogsMeterPrefixQuery = {
  page: 1,
  limit: 20,
  sort: "createdAt_desc",
  actionPrefix: "meter.",
} as const satisfies MasterDataAuditLogsQuery;

export const masterDataAuditLogsInvalidActionQuery = {
  page: 1,
  limit: 20,
  sort: "createdAt_desc",
  action: "user.login",
} as const satisfies MasterDataAuditLogsQuery;

export const masterDataAuditLogsInvalidPrefixQuery = {
  page: 1,
  limit: 20,
  sort: "createdAt_desc",
  actionPrefix: "user.",
} as const satisfies MasterDataAuditLogsQuery;

export const masterDataAuditLogsInvalidPageQuery = {
  page: 0,
  limit: 20,
  sort: "createdAt_desc",
} as const satisfies MasterDataAuditLogsQuery;

export const masterDataAuditLogsInvalidSortQuery = {
  page: 1,
  limit: 20,
  sort: "bad_sort",
} as const satisfies MasterDataAuditLogsQuery;

export interface MasterDataAuditLogsTestCase {
  testName: string;
  query: MasterDataAuditLogsQuery;
  tags: string[];
  sortDirection: "desc" | "asc";
  expectedStatus?: number;
  scenario?:
    | "live_ok"
    | "filter_action"
    | "filter_prefix"
    | "invalid_action"
    | "invalid_prefix"
    | "invalid_page"
    | "invalid_sort";
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export const masterDataAuditLogsTestCases: MasterDataAuditLogsTestCase[] = [
  {
    testName: "Master data change history — newest changes appear first",
    query: { ...masterDataAuditLogsDefaultQuery },
    tags: ["@smoke", "@master-data", "@audit-logs"],
    nonEmptyExpected: true,
    sortDirection: "desc",
    scenario: "live_ok",
  },
  {
    testName: "Master data change history — oldest changes appear first",
    query: { ...masterDataAuditLogsAscQuery },
    tags: ["@master-data", "@audit-logs", "@edge"],
    nonEmptyExpected: false,
    sortDirection: "asc",
    scenario: "live_ok",
  },
  {
    testName: "Master data change history — page 2 shows the next set of changes",
    query: { ...masterDataAuditLogsPage2Query },
    tags: ["@master-data", "@audit-logs", "@edge"],
    nonEmptyExpected: false,
    sortDirection: "desc",
    scenario: "live_ok",
  },
  {
    testName: "Master data change history — showing 10 per page returns at most 10 changes",
    query: { ...masterDataAuditLogsSmallPageQuery },
    tags: ["@master-data", "@audit-logs", "@edge"],
    nonEmptyExpected: false,
    sortDirection: "desc",
    scenario: "live_ok",
  },
  {
    testName: "Master data change history — filter shows only meter-created changes",
    query: { ...masterDataAuditLogsMeterCreatedQuery },
    tags: ["@master-data", "@audit-logs", "@edge"],
    nonEmptyExpected: false,
    sortDirection: "desc",
    scenario: "filter_action",
  },
  {
    testName: "Master data change history — filter shows only meter-related changes",
    query: { ...masterDataAuditLogsMeterPrefixQuery },
    tags: ["@master-data", "@audit-logs", "@edge"],
    nonEmptyExpected: false,
    sortDirection: "desc",
    scenario: "filter_prefix",
  },
  {
    testName: "Master data change history — an action that is not from master data is rejected",
    query: { ...masterDataAuditLogsInvalidActionQuery },
    tags: ["@master-data", "@audit-logs", "@negative"],
    nonEmptyExpected: false,
    sortDirection: "desc",
    expectedStatus: 400,
    scenario: "invalid_action",
  },
  {
    testName: "Master data change history — an unknown change-type filter is rejected",
    query: { ...masterDataAuditLogsInvalidPrefixQuery },
    tags: ["@master-data", "@audit-logs", "@negative"],
    nonEmptyExpected: false,
    sortDirection: "desc",
    expectedStatus: 400,
    scenario: "invalid_prefix",
  },
  {
    testName: "Master data change history — an invalid page number is rejected",
    query: { ...masterDataAuditLogsInvalidPageQuery },
    tags: ["@master-data", "@audit-logs", "@negative"],
    nonEmptyExpected: false,
    sortDirection: "desc",
    expectedStatus: 400,
    scenario: "invalid_page",
  },
  {
    testName: "Master data change history — an invalid sort order is rejected",
    query: { ...masterDataAuditLogsInvalidSortQuery },
    tags: ["@master-data", "@audit-logs", "@negative"],
    nonEmptyExpected: false,
    sortDirection: "desc",
    expectedStatus: 400,
    scenario: "invalid_sort",
  },
];
