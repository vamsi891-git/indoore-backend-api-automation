import { request, type APIRequestContext } from "@playwright/test";
import { AuthApi } from "../../../core/utils/auth.util";

export async function createBearerApiContext(
  accessToken: string,
): Promise<APIRequestContext> {
  if (!process.env.BASE_URL) {
    throw new Error("BASE_URL missing in environment");
  }

  return request.newContext({
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function loginAndCreateApiContext(
  email: string,
  password: string,
): Promise<APIRequestContext> {
  const session = await AuthApi.loginAs(email, password);
  return createBearerApiContext(session.accessToken);
}
