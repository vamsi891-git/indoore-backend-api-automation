export const AuditLogExportTestData = {

    /** Smaller export reduces 429 rate-limit risk; validator only requires rows > 0 and <= limit */
    limit: 100,

    ascSort: "createdAt_asc",

    descSort: "createdAt_desc",

    /** Pause between ASC and DESC export calls to avoid 429 on the second request */
    exportCooldownMs: 180_000,

    /** Max wall time for a single export HTTP round-trip (excludes rate-limit backoff) */
    maxResponseTimeMs: 120_000,

};