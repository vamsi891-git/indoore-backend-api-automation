import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { AuthApi } from "./core/utils/auth.util";
import { LoggerEngine } from "./core/engine/logger.engine";
import { TokenManager } from "./core/utils/token-manager";

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

async function globalSetup(): Promise<void> {
  dotenv.config();
  LoggerEngine.info("Global setup started");

  validateEnv();
  ensureDirectory("logs");
  ensureDirectory("reports");
  ensureDirectory("test-results");
  ensureDirectory(path.join("playwright", ".auth"));
  TokenManager.clearStaleLock();

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
