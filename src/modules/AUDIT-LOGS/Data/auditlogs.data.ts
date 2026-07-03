import type { AuditLogsQuery } from "../Mapper/auditlogs.mapper";

export const auditLogsDefaultQuery = {
  page: 1,
  limit: 20,
  sort: "createdAt_desc",
} as const;

export const auditLogsAscQuery = {
  page: 1,
  limit: 20,
  sort: "createdAt_asc",
} as const;

export const auditLogsPage2Query = {
  page: 2,
  limit: 20,
  sort: "createdAt_desc",
} as const;

export const auditLogsSmallPageQuery = {
  page: 1,
  limit: 10,
  sort: "createdAt_desc",
} as const;

export const auditLogsMaxResponseTimeMs = 60_000;

export interface AuditLogsTestCase {
  testName: string;
  query: AuditLogsQuery;
  tags: string[];
  sortDirection: "desc" | "asc";
}

export const auditLogsTestCases: AuditLogsTestCase[] = [
  {
    testName:
      "Validate GET /indore/users/audit-logs — default page (createdAt_desc)",
    query: { ...auditLogsDefaultQuery },
    tags: ["@smoke", "@audit-logs"],
    sortDirection: "desc",
  },
  {
    testName: "Validate sort — createdAt_asc",
    query: { ...auditLogsAscQuery },
    tags: ["@audit-logs"],
    sortDirection: "asc",
  },
  {
    testName: "Validate pagination — page 2",
    query: { ...auditLogsPage2Query },
    tags: ["@audit-logs"],
    sortDirection: "desc",
  },
  {
    testName: "Validate pagination — smaller page size (limit 10)",
    query: { ...auditLogsSmallPageQuery },
    tags: ["@audit-logs"],
    sortDirection: "desc",
  },
];
