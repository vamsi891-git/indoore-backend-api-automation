/** Pick first non-blank string from candidates (API field renames / splits). */
export function firstNonBlank(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return null;
}

export function compareMasterLabelsAsc(a: string, b: string): number {
  // Match typical Postgres text ASC (byte/collation order), not numeric natural sort.
  return a.localeCompare(b, "en", { sensitivity: "variant", numeric: false });
}
