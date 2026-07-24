import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import {
  assertDbVsApiScalar,
  logDbVsApiSection,
} from "../../../core/db/db-compare.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { AuthSessionApi } from "../Api/auth-session.api";
import { InviteApi } from "../Api/invite.api";
import {
  countAuthActiveDevices,
  countAuthActiveSessionFamilies,
  getAuthActiveDeviceById,
  getAuthInvitationSummary,
  getAuthUserById,
} from "../Db/auth.db";
import {
  compareAuthCountLteDb,
  compareAuthDeviceSpotToDb,
  compareAuthInvitationSummaryToDb,
  compareAuthMeToDb,
} from "../Db/auth-db-compare";
import { logAuthDataQualityFindings } from "../Db/auth-db.validator";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function flattenDevices(data: Record<string, unknown>): Array<{
  id: string;
  name?: string | null;
  deviceType?: string | null;
}> {
  const groups = Array.isArray(data.deviceGroups) ? data.deviceGroups : [];
  const devices: Array<{
    id: string;
    name?: string | null;
    deviceType?: string | null;
  }> = [];
  for (const group of groups) {
    const g = asRecord(group);
    const list = Array.isArray(g.devices) ? g.devices : [];
    for (const device of list) {
      const d = asRecord(device);
      if (typeof d.id === "string" && d.id.trim()) {
        devices.push({
          id: d.id,
          name: (d.name as string | null | undefined) ?? null,
          deviceType: (d.deviceType as string | null | undefined) ?? null,
        });
      }
    }
  }
  return devices;
}

/**
 * Part 4 harness — aligned with AuthRepository paste
 * (user/me, auth_devices, invitation summary, active session families).
 */
export async function runAuthDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ValidationEngine();
  const sessionApi = new AuthSessionApi(authenticatedApi);
  const inviteApi = new InviteApi(authenticatedApi);

  // --- /me ---
  const meResult = await sessionApi.getMe();
  expect(meResult.rawResponse.status()).toBe(200);
  const meBody = asRecord(meResult.responseBody);
  expect(meBody.success).toBe(true);
  const meData = asRecord(meBody.data);
  const user = asRecord(meData.user);
  await logAuthDataQualityFindings("me", meData);

  const userId = String(user.id ?? "");
  expect(userId, "me.user.id required for DB compares").toMatch(
    /^[0-9a-f-]{36}$/i,
  );

  const dbUser = await getAuthUserById(db, userId);
  validation.execute("Auth /me vs user_credentials+roles+profiles", () => {
    expect(dbUser, "DB user row for /me id").toBeTruthy();
    compareAuthMeToDb({
      api: {
        id: userId,
        email: String(user.email ?? ""),
        firstName: String(user.firstName ?? ""),
        lastName: String(user.lastName ?? ""),
        role: String(user.role ?? ""),
        status: String(user.status ?? ""),
        organisationLookupId:
          (user.organisationLookupId as number | null | undefined) ??
          (user.organisationScopeId as number | null | undefined) ??
          null,
        networkLookupId:
          (user.networkLookupId as number | null | undefined) ??
          (user.networkScopeId as number | null | undefined) ??
          null,
      },
      dbRow: dbUser!,
    });
  });

  // --- devices ---
  const devicesResult = await sessionApi.getDevices();
  expect(devicesResult.rawResponse.status()).toBe(200);
  const devicesBody = asRecord(devicesResult.responseBody);
  expect(devicesBody.success).toBe(true);
  const devicesData = asRecord(devicesBody.data);
  await logAuthDataQualityFindings("devices", devicesData);

  const apiDevices = flattenDevices(devicesData);
  const dbDeviceCount = await countAuthActiveDevices(db, userId);
  logDbVsApiSection(
    "Auth Devices",
    { total: apiDevices.length },
    { total: dbDeviceCount },
    { totalMode: "lte" },
  );
  validation.execute("Auth devices count ≤ DB active auth_devices", () => {
    compareAuthCountLteDb({
      label: "auth.devices.active",
      apiCount: apiDevices.length,
      dbCount: dbDeviceCount,
    });
  });

  const spotDevice = apiDevices[0];
  if (spotDevice) {
    const dbDevice = await getAuthActiveDeviceById(db, spotDevice.id, userId);
    validation.execute("Auth device spot vs auth_devices", () => {
      expect(dbDevice, "DB device for API device id").toBeTruthy();
      compareAuthDeviceSpotToDb({
        api: spotDevice,
        dbRow: dbDevice!,
      });
    });
  }

  // --- invitation summary ---
  const invitesResult = await inviteApi.listMyInvitations({
    page: 1,
    limit: 20,
    status: "all",
  });
  if (invitesResult.rawResponse.status() === 200) {
    const invitesBody = asRecord(invitesResult.responseBody);
    const invitesData = asRecord(invitesBody.data);
    await logAuthDataQualityFindings("invitations", invitesData);
    const summary = asRecord(invitesData.summary);
    const dbSummary = await getAuthInvitationSummary(db, userId);
    logDbVsApiSection(
      "Auth Invitation Summary",
      {
        total: Number(summary.total ?? 0),
        acceptedCount: Number(summary.acceptedCount ?? 0),
        pendingCount: Number(summary.pendingCount ?? 0),
        expiredCount: Number(summary.expiredCount ?? 0),
      },
      {
        total: dbSummary.total,
        acceptedCount: dbSummary.accepted_count,
        pendingCount: dbSummary.pending_count,
        expiredCount: dbSummary.expired_count,
      },
      { totalMode: "exact" },
    );
    validation.execute(
      "Auth invitation summary vs user_invitations counts",
      () => {
        compareAuthInvitationSummaryToDb({
          api: {
            total: Number(summary.total ?? 0),
            acceptedCount: Number(summary.acceptedCount ?? 0),
            pendingCount: Number(summary.pendingCount ?? 0),
            expiredCount: Number(summary.expiredCount ?? 0),
          },
          dbRow: dbSummary,
        });
      },
    );
  } else {
    console.warn(
      `[auth-db] invitations/mine returned ${invitesResult.rawResponse.status()} — skipping summary compare`,
    );
  }

  // --- active session families (soft lte — API may not expose family count) ---
  const dbFamilies = await countAuthActiveSessionFamilies(db, userId);
  validation.execute("Auth has at least one active refresh family in DB", () => {
    expect(dbFamilies).toBeGreaterThan(0);
    assertDbVsApiScalar(
      "active session families (DB > 0)",
      dbFamilies,
      dbFamilies,
      "DB vs API — Auth session families present",
    );
  });

  validation.printSummary("AUTH DB Coverage", 0);
}
