import type { APIRequestContext } from "@playwright/test";
import { UserManagementApi } from "../Api/usermanagement.api";
import {
  pickDeviceTestUserId,
  UserDevicesTestConfig,
} from "../Data/usermanagement.data";
import { UserManagementMapper } from "../Mapper/usermanagement.mapper";

/** Resolve a live user id for GET/DELETE /users/:id/devices. */
export async function resolveLiveDeviceTestUserId(
  authenticatedApi: APIRequestContext,
): Promise<string> {
  const userApi = new UserManagementApi(authenticatedApi);
  const listResponse = await userApi.getUsers(1, UserDevicesTestConfig.pageSize);
  const users = UserManagementMapper.mapUsers(listResponse.responseBody).users;
  return pickDeviceTestUserId(users);
}
