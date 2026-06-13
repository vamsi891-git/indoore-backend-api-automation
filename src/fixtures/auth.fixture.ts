import { test as base, request, APIRequestContext } from "./base.fixture";
import { LoggerEngine } from "../core/engine/logger.engine";

type AuthFixtures = {
  /** Raw API context without Bearer token — for login / refresh contract tests */
  unauthenticatedApi: APIRequestContext;
};

export const test = base.extend<AuthFixtures>({
  unauthenticatedApi: async ({}, use) => {
    if (!process.env.BASE_URL) {
      throw new Error("BASE_URL missing in environment");
    }

    const apiContext = await request.newContext({
      baseURL: process.env.BASE_URL,
      extraHTTPHeaders: {
        Accept: "application/json",
      },
    });

    LoggerEngine.info("Unauthenticated API fixture context created");
    await use(apiContext);
    await apiContext.dispose();
    LoggerEngine.info("Unauthenticated API fixture context disposed");
  },
});
