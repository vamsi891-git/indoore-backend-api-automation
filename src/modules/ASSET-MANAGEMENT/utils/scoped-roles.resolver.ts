import type { APIRequestContext } from "@playwright/test";
import { AuthApi } from "../../../core/utils/auth.util";
import {
  isAutomationAccount,
  resolveAutomationEmail,
} from "../../USERS-ADMIN/Data/usermanagement.data";
import { UserManagementApi } from "../../USERS-ADMIN/Api/usermanagement.api";
import { UserManagementMapper } from "../../USERS-ADMIN/Mapper/usermanagement.mapper";
import {
  AssetManagementScopedRoles,
  type ScopedRoleCredentials,
} from "../Data/asset-management.common.data";

const DISCOVERABLE_ROLE_TARGETS: Array<{
  label: string;
  matches: (role: string) => boolean;
  emailKey: "VIEWER_EMAIL" | "OPERATOR_EMAIL";
  passwordKey: "VIEWER_PASSWORD" | "OPERATOR_PASSWORD";
}> = [
  {
    label: "Viewer",
    matches: (role) => normalizeRole(role) === "viewer",
    emailKey: "VIEWER_EMAIL",
    passwordKey: "VIEWER_PASSWORD",
  },
  {
    label: "Operator",
    matches: (role) => normalizeRole(role) === "operator",
    emailKey: "OPERATOR_EMAIL",
    passwordKey: "OPERATOR_PASSWORD",
  },
  {
    label: "Manager",
    matches: (role) => normalizeRole(role) === "manager",
    emailKey: "VIEWER_EMAIL",
    passwordKey: "VIEWER_PASSWORD",
  },
];

function normalizeRole(role: string): string {
  return role.trim().toLowerCase().replace(/\s+/g, "_");
}

function resolveRolePassword(
  passwordKey: "VIEWER_PASSWORD" | "OPERATOR_PASSWORD",
): string | undefined {
  return (
    process.env[passwordKey]?.trim() ||
    process.env.SCOPED_ROLE_PASSWORD?.trim() ||
    process.env.PASSWORD?.trim()
  );
}

async function verifyLogin(email: string, password: string): Promise<boolean> {
  try {
    await AuthApi.loginAs(email, password);
    return true;
  } catch {
    return false;
  }
}

async function discoverScopedRolesFromUsers(
  adminApi: APIRequestContext,
): Promise<ScopedRoleCredentials[]> {
  const userApi = new UserManagementApi(adminApi);
  const listResponse = await userApi.getUsers(1, 100);
  if (listResponse.rawResponse.status() !== 200) {
    return [];
  }

  const users = UserManagementMapper.mapUsers(listResponse.responseBody).users;
  const activeUsers = users.filter(
    (user) =>
      user.status.toLowerCase() === "active" &&
      !isAutomationAccount(user) &&
      user.email.trim().length > 0,
  );

  const resolved: ScopedRoleCredentials[] = [];
  const usedEmails = new Set<string>();

  for (const target of DISCOVERABLE_ROLE_TARGETS) {
    const explicitEmail = process.env[target.emailKey]?.trim();
    if (explicitEmail) {
      continue;
    }

    const candidate = activeUsers.find(
      (user) => target.matches(user.role) && !usedEmails.has(user.email.toLowerCase()),
    );
    if (!candidate) {
      continue;
    }

    const password = resolveRolePassword(target.passwordKey);
    if (!password) {
      continue;
    }

    const canLogin = await verifyLogin(candidate.email, password);
    if (!canLogin) {
      continue;
    }

    usedEmails.add(candidate.email.toLowerCase());
    resolved.push({
      label: target.label,
      email: candidate.email,
      password,
    });
  }

  return resolved;
}

/** Env-configured roles first; otherwise discover scoped users from the users catalog. */
export async function resolveAssetManagementScopedRoles(
  adminApi: APIRequestContext,
): Promise<ScopedRoleCredentials[]> {
  if (AssetManagementScopedRoles.length > 0) {
    return AssetManagementScopedRoles;
  }

  if (!resolveAutomationEmail()) {
    return [];
  }

  return discoverScopedRolesFromUsers(adminApi);
}
