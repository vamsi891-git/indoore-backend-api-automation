export const EXPECTED_AUDIT_LOG_EXPORT_COLUMNS = [
  "id",
  "createdAt",
  "action",
  "actorId",
  "actorEmail",
  "actorFullName",
  "actorRoleName",
  "targetId",
  "targetEmail",
  "targetFullName",
  "targetRoleName",
  "ipAddress",
  "details",
] as const;

export const AuditLogExportTestData = {
  limit: 20,
  page: 1,
  ascSort: "createdAt_asc",
  descSort: "createdAt_desc",
  maxResponseTimeMs: 180_000,
  requestTimeoutMs: 180_000,
  exportPath:
    process.env.AUDIT_LOG_EXPORT_PATH?.trim() ||
    "/indore/users/audit-logs/export",
};

export function auditLogExportQuery(params: {
  page?: number;
  limit?: number;
  sort?: string;
}): string {
  const page = params.page ?? AuditLogExportTestData.page;
  const limit = params.limit ?? AuditLogExportTestData.limit;
  const sort = params.sort ?? AuditLogExportTestData.descSort;
  return `page=${page}&limit=${limit}&sort=${sort}`;
}
