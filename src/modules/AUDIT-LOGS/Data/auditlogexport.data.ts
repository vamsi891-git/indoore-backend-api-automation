export const AuditLogExportTestData = {
    /** Smaller export reduces 429 rate-limit risk; validator only requires rows > 0 and <= limit */
    limit: 100,
    ascSort: "createdAt_asc",
    descSort: "createdAt_desc",
    /** Minimum gap between any two export HTTP calls (shared across ASC/DESC tests) */
    minExportIntervalMs: 300_000,
    /** Max wall time for a single export HTTP round-trip (excludes rate-limit spacing) */
    maxResponseTimeMs: 120_000,

};
