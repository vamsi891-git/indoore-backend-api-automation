import { assertDbVsApiScalar } from "../../../core/db/db-compare.engine";

/** Fail when the API number is not the same as the SQL count. */
export function compareApiEqualsSql(options: {
  label: string;
  apiCount: number;
  sqlCount: number;
  sqlName?: string;
}): void {
  const title = options.sqlName
    ? `Dashboard — ${options.label} [${options.sqlName}]`
    : `Dashboard — ${options.label}`;
  assertDbVsApiScalar(options.label, options.apiCount, options.sqlCount, title);
}

export function compareDashboardMetricMissingRow(): never {
  throw new Error(
    "DB dashboard metric row missing\n  Hint: confirm L_Network_Lookup / L_Meter_Lookup universe SQL.",
  );
}
