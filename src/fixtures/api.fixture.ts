import { test as base, request, APIRequestContext } from "./base.fixture";
import { LoggerEngine } from "../core/engine/logger.engine";
import {
  getWithAutoRefresh,
  postWithAutoRefresh,
  putWithAutoRefresh,
  patchWithAutoRefresh,
  deleteWithAutoRefresh,
} from "../core/utils/authenticated.request";
import { normalizeApiBaseUrl } from "../core/utils/api-path.util";
import { env } from "../core/config/env.schema";
type ApiFixtures = {
  authenticatedApi: APIRequestContext;
};
export const test = base.extend<ApiFixtures>({
  // Playwright requires object destructuring for the fixtures arg (even when unused).
  authenticatedApi: async ({}, use) => {
    if (!env.BASE_URL) {
      throw new Error("BASE_URL missing in environment");
    }
    const apiContext = await request.newContext({
      baseURL: normalizeApiBaseUrl(env.BASE_URL),
      extraHTTPHeaders: {
        Accept: "application/json",
      },
    });
    const wrappedApiContext = {
      ...apiContext,
      get: (url: string, options?: unknown) =>
        getWithAutoRefresh(apiContext, url, options as Parameters<typeof getWithAutoRefresh>[2]),
      post: (url: string, options?: unknown) =>
        postWithAutoRefresh(apiContext, url, options as Parameters<typeof postWithAutoRefresh>[2]),
      put: (url: string, options?: unknown) =>
        putWithAutoRefresh(apiContext, url, options as Parameters<typeof putWithAutoRefresh>[2]),
      patch: (url: string, options?: unknown) =>
        patchWithAutoRefresh(
          apiContext,
          url,
          options as Parameters<typeof patchWithAutoRefresh>[2],
        ),
      delete: (url: string, options?: unknown) =>
        deleteWithAutoRefresh(
          apiContext,
          url,
          options as Parameters<typeof deleteWithAutoRefresh>[2],
        ),
    } as APIRequestContext;

    LoggerEngine.info("API fixture context created");
    await use(wrappedApiContext);
    await apiContext.dispose();
    LoggerEngine.info("API fixture context disposed");
  },
});
