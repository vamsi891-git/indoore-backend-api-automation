import { test as base, request, APIRequestContext } from "./base.fixture";
import { LoggerEngine } from "../core/engine/logger.engine";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "../core/constants/api-timeouts";

type HesFixtures = {
  hesApi: APIRequestContext;
};

function buildHesHeaders(): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json"
  };
}

function buildHttpCredentials():
  | { username: string; password: string }
  | undefined {
  const username = process.env.HES_USERNAME?.trim();
  const password = process.env.HES_PASSWORD;

  if (username && password) {
    return { username, password };
  }

  return undefined;
}

export function isHesConfigured(): boolean {
  return Boolean(process.env.HES_BASE_URL?.trim());
}

export const test = base.extend<HesFixtures>({
  hesApi: async ({}, use, testInfo) => {
    if (!isHesConfigured()) {
      testInfo.skip(true, "HES_BASE_URL not configured");
      return;
    }

    const httpCredentials = buildHttpCredentials();
    const apiContext = await request.newContext({
      baseURL: process.env.HES_BASE_URL,
      extraHTTPHeaders: buildHesHeaders(),
      ...(httpCredentials ? { httpCredentials } : {}),
      timeout: DEFAULT_REQUEST_TIMEOUT_MS
    });

    LoggerEngine.info("HES API fixture context created");
    await use(apiContext);
    await apiContext.dispose();
    LoggerEngine.info("HES API fixture context disposed");
  }
});
