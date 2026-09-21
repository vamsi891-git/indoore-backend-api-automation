import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import { compareApiToDb } from "../../../extras/db/db-compare.engine";
import { ModulePermissionApi } from "../Api/modulepermission.api";
import { ModulePermissionMapper } from "../Mapper/modulepermission.mapper";
import {
  countModulesCatalog,
  countPermissionsCatalog,
  getModuleById,
} from "../Db/modules-permissions.db";
import { compareModuleSpotToDb } from "../Db/modules-permissions-db-compare";
import { logModulesPermissionsDataQualityFindings } from "../Db/modules-permissions-db.validator";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

/**
 * Part 4 harness — unscoped modules/permissions catalog exact counts + spot.
 */
export async function runModulesPermissionsDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ApiValidationHelper();
  const api = new ModulePermissionApi(authenticatedApi);
  const { rawResponse, responseBody } = await api.getModules();
  expect(rawResponse.status()).toBe(200);

  const modules = ModulePermissionMapper.mapModules(responseBody);
  await logModulesPermissionsDataQualityFindings(
    "modules",
    responseBody.data as unknown as Record<string, unknown>,
  );

  const dbModuleCount = await countModulesCatalog(db);
  const dbPermissionCount = await countPermissionsCatalog(db);
  const apiPermissionCount = modules.reduce((sum, mod) => sum + (mod.permissions?.length ?? 0), 0);

  validation.execute("Modules catalog count exact vs DB", () => {
    expect(dbModuleCount).toBeGreaterThan(0);
    compareApiToDb(
      [
        {
          label: "modules.count",
          apiValue: modules.length,
          dbValue: dbModuleCount,
        },
      ],
      "DB vs API — modules catalog count",
    );
  });

  validation.execute("Permissions catalog count exact vs DB", () => {
    compareApiToDb(
      [
        {
          label: "permissions.count",
          apiValue: apiPermissionCount,
          dbValue: dbPermissionCount,
        },
      ],
      "DB vs API — permissions catalog count",
    );
  });

  const spot = modules[0];
  if (!spot) {
    console.warn("[BACKEND FINDING] module spot skipped — empty modules catalog");
  } else {
    const dbRow = await getModuleById(db, spot.id);
    validation.execute(`Module spot vs DB (${spot.id} / ${spot.key})`, () => {
      compareModuleSpotToDb({
        api: {
          id: spot.id,
          key: spot.key,
          name: spot.name,
          isEnabled: spot.isEnabled,
          permissionCount: spot.permissions?.length ?? 0,
        },
        dbRow,
      });
    });
  }

  validation.printSummary("MODULES-PERMISSIONS DB Coverage", 0);
}
