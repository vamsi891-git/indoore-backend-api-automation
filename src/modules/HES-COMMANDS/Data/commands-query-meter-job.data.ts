export const commandsQueryMeterJobData = {
  /** Job name from live smoke (override via QUERY_METER_JOB_NAME). */
  knownJobName:
    process.env.QUERY_METER_JOB_NAME?.trim() || "1781589130356282",
  /** Meter serial expected inside meterResults for the known job. */
  expectedMeterId:
    process.env.VALID_METER_SERIAL?.trim() || "99751580",
  unknownJobName: "0000000000000000000",
  maxResponseTimeMs: 120_000,
} as const;

export function buildQueryMeterJobPath(jobName: string): string {
  return `/indore/commands/query-meter-job/${encodeURIComponent(jobName.trim())}`;
}
