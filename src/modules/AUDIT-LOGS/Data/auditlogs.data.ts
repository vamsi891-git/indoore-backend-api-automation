import type { AuditLogsQuery } from "../Mapper/auditlogs.mapper";

export const auditLogsPath = "/indore/users/audit-logs";

export function auditLogsQueryString(query: AuditLogsQuery): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.limit != null) params.set("limit", String(query.limit));
  if (query.sort != null) params.set("sort", query.sort);
  if (query.action?.trim()) params.set("action", query.action.trim());
  if (query.cursor?.trim()) params.set("cursor", query.cursor.trim());
  return params.toString();
}

export const auditLogsDefaultQuery: AuditLogsQuery = {
  page: 1,
  limit: 20,
  sort: "createdAt_desc",
};

export const auditLogsAscQuery: AuditLogsQuery = {
  page: 1,
  limit: 20,
  sort: "createdAt_asc",
};

export const auditLogsPage2Query: AuditLogsQuery = {
  page: 2,
  limit: 20,
  sort: "createdAt_desc",
};

export const auditLogsSmallPageQuery: AuditLogsQuery = {
  page: 1,
  limit: 10,
  sort: "createdAt_desc",
};

export const auditLogsBeyondQuery: AuditLogsQuery = {
  page: 999_999,
  limit: 20,
  sort: "createdAt_desc",
};

export const auditLogsMaxResponseTimeMs = 60_000;

export const EXPECTED_AUDIT_LOG_COLUMNS = [
  "id",
  "actorId",
  "targetId",
  "actorFullName",
  "actorEmail",
  "actorRoleName",
  "targetFullName",
  "targetEmail",
  "targetRoleName",
  "action",
  "details",
  "ipAddress",
  "createdAt",
  "actionLabel",
  "actorLabel",
  "roleLabel",
  "ipAddressLabel",
  "detailsLines",
  "detailsLabel",
] as const;

export const EXPECTED_AUDIT_LOGS_DATA_COLUMNS = [
  "logs",
  "actionFilterOptions",
  "total",
  "page",
  "limit",
  "totalPages",
  "nextCursor",
] as const;

export const EXPECTED_ACTION_FILTER_OPTION_COLUMNS = ["value", "label"] as const;

export interface AuditLogsTestCase {
  testName: string;
  query: AuditLogsQuery;
  tags: string[];
  sortDirection: "desc" | "asc";
  requireLogs?: boolean;
  /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

export const auditLogsTestCases: AuditLogsTestCase[] = [
  {
    testName: "GET /users/audit-logs — default page (createdAt_desc)",
    query: { ...auditLogsDefaultQuery },
    tags: ["@smoke", "@audit-logs"],
    nonEmptyExpected: true,
    sortDirection: "desc",
  },
  {
    testName: "GET /users/audit-logs — createdAt_asc",
    query: { ...auditLogsAscQuery },
    tags: ["@smoke", "@audit-logs"],
    nonEmptyExpected: true,
    sortDirection: "asc",
  },
  {
    testName: "GET /users/audit-logs — page 2",
    query: { ...auditLogsPage2Query },
    tags: ["@smoke", "@audit-logs"],
    nonEmptyExpected: true,
    sortDirection: "desc",
  },
  {
    testName: "GET /users/audit-logs — limit 10",
    query: { ...auditLogsSmallPageQuery },
    tags: ["@smoke", "@audit-logs"],
    nonEmptyExpected: true,
    sortDirection: "desc",
  },
  {
    testName: "GET /users/audit-logs — page beyond total",
    query: { ...auditLogsBeyondQuery },
    tags: ["@smoke", "@audit-logs"],
    nonEmptyExpected: true,
    sortDirection: "desc",
    requireLogs: false,
  },
];

export const AuditLogsInvalidQueries = [
  {
    testName: "GET /users/audit-logs — page=0",
    query: "page=0&limit=20&sort=createdAt_desc",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /users/audit-logs — limit=0",
    query: "page=1&limit=0&sort=createdAt_desc",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /users/audit-logs — sort=foo",
    query: "page=1&limit=20&sort=foo",
    expectedStatus: [400, 422] as const,
  },
  {
    testName: "GET /users/audit-logs — cursor=abc",
    query: "page=1&limit=20&sort=createdAt_desc&cursor=abc",
    expectedStatus: [400, 422] as const,
  },
] as const;
