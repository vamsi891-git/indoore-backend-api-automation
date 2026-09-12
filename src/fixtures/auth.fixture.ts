import { test as base, request, expect, APIRequestContext } from "./base.fixture";
import { LoggerEngine } from "../core/engine/logger.engine";
import { resolveApiPath, normalizeApiBaseUrl } from "../core/utils/api-path.util";

type AuthFixtures = {
  /** Raw API context without Bearer token — for login / refresh contract tests */
  unauthenticatedApi: APIRequestContext;
};

export { expect, request };
export type { APIRequestContext };

function wrapUnauthenticatedContext(
  apiContext: APIRequestContext,
): APIRequestContext {
  return {
    ...apiContext,
    get: (url: string, options?: Parameters<APIRequestContext["get"]>[1]) =>
      apiContext.get(resolveApiPath(url), options),
    post: (url: string, options?: Parameters<APIRequestContext["post"]>[1]) =>
      apiContext.post(resolveApiPath(url), options),
    put: (url: string, options?: Parameters<APIRequestContext["put"]>[1]) =>
      apiContext.put(resolveApiPath(url), options),
    patch: (url: string, options?: Parameters<APIRequestContext["patch"]>[1]) =>
      apiContext.patch(resolveApiPath(url), options),
    delete: (
      url: string,
      options?: Parameters<APIRequestContext["delete"]>[1],
    ) => apiContext.delete(resolveApiPath(url), options),
    fetch: (url: string, options?: Parameters<APIRequestContext["fetch"]>[1]) =>
      apiContext.fetch(resolveApiPath(url), options),
  } as APIRequestContext;
}

export const test = base.extend<AuthFixtures>({
  unauthenticatedApi: async ({}, use) => {
    if (!process.env.BASE_URL) {
      throw new Error("BASE_URL missing in environment");
    }

    const apiContext = await request.newContext({
      baseURL: normalizeApiBaseUrl(process.env.BASE_URL),
      extraHTTPHeaders: {
        Accept: "application/json",
      },
    });

    LoggerEngine.info("Unauthenticated API fixture context created");
    await use(wrapUnauthenticatedContext(apiContext));
    await apiContext.dispose();
    LoggerEngine.info("Unauthenticated API fixture context disposed");
  },
});
