/** Set REPORTS_SKIP_BACKEND_DEFECTS=1 to skip @backend-defect cases (green CI while backend fixes land). */
export function shouldSkipReportsBackendDefect(tags: readonly string[]): boolean {
  const flag = process.env.REPORTS_SKIP_BACKEND_DEFECTS?.trim().toLowerCase();
  const enabled = flag === "1" || flag === "true" || flag === "yes";
  return enabled && tags.includes("@backend-defect");
}
