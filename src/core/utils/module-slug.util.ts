/** Folder name → workflow slug, e.g. `HES-COMMANDS` → `hes-commands`. */
export function moduleNameToSlug(moduleName: string): string {
  return moduleName.toLowerCase().replace(/\s+/g, "-");
}
