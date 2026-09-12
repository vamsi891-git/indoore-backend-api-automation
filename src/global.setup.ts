import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { AuthApi } from "./core/utils/auth.util";
import { LoggerEngine } from "./core/engine/logger.engine";
import { TokenManager } from "./core/utils/token-manager";
import { initRunId } from "./observability/logger";
import { resolveApiPath } from "./core/utils/api-path.util";

function ensureDirectory(dirName: string): void {
  const dirPath = path.join(process.cwd(), dirName);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function validateEnv(): void {
  const required = ["BASE_URL", "PASSWORD"] as const;
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  if (!process.env.EMAIL && !process.env.USERNAME) {
    throw new Error("Missing required environment variable: EMAIL (or USERNAME)");
  }
}

async function assertApiReachable(): Promise<void> {
  const baseURL = (process.env.BASE_URL ?? "").replace(/\/$/, "");
  const probeUrl = `${baseURL}${resolveApiPath("/indore/auth/login")}`;
  try {
    await fetch(probeUrl, { method: "GET", signal: AbortSignal.timeout(8_000) });
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    throw new Error(
      `API is not reachable at ${baseURL} (${cause}). ` +
        "Start the local backend on port 3000, or set BASE_URL to a running API. " +
        "Cached auth tokens are not used until the API responds.",
    );
  }
}

async function globalSetup(): Promise<void> {
  dotenv.config();
  LoggerEngine.info("Global setup started");

  const runId = initRunId();
  LoggerEngine.info(`Observability runId for this run: ${runId}`);

  validateEnv();
  if (process.env.STRIP_INDORE_PREFIX?.trim()) {
    LoggerEngine.info(
      "STRIP_INDORE_PREFIX enabled — /indore/... paths rewrite to /... for local API",
    );
  }
  ensureDirectory("logs");
  ensureDirectory("reports");
  ensureDirectory("test-results");
  ensureDirectory(path.join("playwright", ".auth"));
  TokenManager.clearStaleLock();
  await assertApiReachable();

  const cachedSession = TokenManager.loadValidSession();
  if (cachedSession) {
    TokenManager.seed(
      cachedSession.accessToken,
      cachedSession.expiresInSeconds,
      cachedSession.csrfToken,
    );
    LoggerEngine.info("Global setup reused valid cached auth token");
    LoggerEngine.info("Global setup completed");
    return;
  }

  const login = await AuthApi.login();
  if (!login.accessToken) {
    throw new Error("Auth warmup failed: missing access token");
  }

  TokenManager.seed(login.accessToken, login.expiresIn, login.csrfToken);
  LoggerEngine.info("Global setup completed");
}

export default globalSetup;
