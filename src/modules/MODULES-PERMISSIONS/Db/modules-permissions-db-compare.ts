import {
  compareApiToDb,
  logDbVsApiSection,
  type DbCompareObs,
} from "../../../extras/db/db-compare.engine";
import type { DbModulesPermissionsModuleRow } from "./modules-permissions.db";

/**
 * Bound check for mutation-proof — throws when API > DB.
 * Catalog is unscoped; live harness uses exact compareApiToDb.
 */
export function compareModulesPermissionsCountLteDb(options: {
  label: string;
  apiCount: number;
  dbCount: number;
  obs?: DbCompareObs;
}): void {
  logDbVsApiSection(
    `Modules-Permissions — ${options.label}`,
    {
      total: options.apiCount,
      page: 1,
      limit: 1,
      rowCount: 1,
    },
    { total: options.dbCount },
    { totalMode: "lte" },
  );

  if (options.apiCount > options.dbCount) {
    throw new Error(
      [
        `${options.label}: API exceeds DB universe`,
        `  API=${options.apiCount}`,
        `  DB=${options.dbCount}`,
      ].join("\n"),
    );
  }
}

export function compareModuleSpotToDb(options: {
  api: {
    id: number;
    key?: string | null;
    name?: string | null;
    isEnabled?: boolean | null;
    permissionCount: number;
  };
  dbRow: DbModulesPermissionsModuleRow | null;
  obs?: DbCompareObs;
}): void {
  const { api, dbRow, obs } = options;
  if (!dbRow) {
    throw new Error(
      ["DB modules row missing", `  id=${api.id}`, "  Hint: confirm general.modules catalog."].join(
        "\n",
      ),
    );
  }

  compareApiToDb(
    [
      { label: "id", apiValue: api.id, dbValue: dbRow.id },
      {
        label: "key",
        apiValue: String(api.key ?? "").trim(),
        dbValue: String(dbRow.key ?? "").trim(),
      },
      {
        label: "name",
        apiValue: String(api.name ?? "").trim(),
        dbValue: String(dbRow.name ?? "").trim(),
      },
      {
        label: "isEnabled",
        apiValue: api.isEnabled ?? true,
        dbValue: dbRow.isEnabled,
        optional: true,
      },
      {
        label: "permissionCount",
        apiValue: api.permissionCount,
        dbValue: dbRow.permissionCount,
      },
    ],
    `DB vs API — module spot (${api.id})`,
    obs,
  );
}
