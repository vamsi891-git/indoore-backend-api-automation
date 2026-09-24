import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { AuthApi } from "./core/utils/auth.util";
import { LoggerEngine } from "./core/engine/logger.engine";
import { TokenManager } from "./core/utils/token-manager";
import { initRunId } from "./extras/observability/logger";
import {
  resolveApiPath,
  normalizeApiBaseUrl,
  isStripIndorePrefixEnabled,
  enableStripIndorePrefix,
} from "./core/utils/api-path.util";
import { env, loadEnv } from "./core/config/env.schema";

function ensureDirectory(dirName: string): void {
  const dirPath = path.join(process.cwd(), dirName);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function apiHostLabel(baseURL: string): string {
  try {
    return new URL(baseURL).hostname;
  } catch {
    return "(invalid BASE_URL)";
  }
}

function isPrivateOrLocalHost(hostname: string): boolean {
  return (
    /^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)$/i.test(hostname) ||
    /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
    /^192\.168\.\d+\.\d+$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)
  );
}

async function assertApiReachable(): Promise<void> {
  const baseURL = normalizeApiBaseUrl(env.BASE_URL);
  const host = apiHostLabel(baseURL);
  const onGitHub = env.GITHUB_ACTIONS;

  if (onGitHub && isPrivateOrLocalHost(host)) {
    throw new Error(
      `GitHub Actions cannot reach ${host}. Set repository secret BASE_URL to the public HTTPS API (not localhost or a VPN/LAN address).`,
    );
  }

  const delaysMs = onGitHub ? [0, 10_000, 20_000, 30_000] : [0];
  let lastStatus = 0;
  let lastCause = "";

  const isGateway = (status: number) => status === 502 || status === 503 || status === 504;

  const loginPaths = Array.from(
    new Set([resolveApiPath("/indore/auth/login"), "/auth/login", "/indore/auth/login"]),
  );

  for (let i = 0; i < delaysMs.length; i++) {
    if (delaysMs[i] > 0) {
      await new Promise((resolve) => setTimeout(resolve, delaysMs[i]));
    }
    try {
      let reachable = false;
      for (const loginPath of loginPaths) {
        const probeUrl = `${baseURL}${loginPath}`;
        const getResponse = await fetch(probeUrl, {
          method: "GET",
          signal: AbortSignal.timeout(15_000),
        });
        lastStatus = getResponse.status;
        if (!isGateway(lastStatus) && lastStatus !== 404) {
          reachable = true;
          break;
        }

        const postResponse = await fetch(probeUrl, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: "{}",
          signal: AbortSignal.timeout(15_000),
        });
        lastStatus = postResponse.status;
        lastCause = `HTTP ${lastStatus} on ${loginPath}`;
        if (!isGateway(lastStatus) && lastStatus !== 404) {
          if (loginPath === "/auth/login") {
            enableStripIndorePrefix();
          }
          reachable = true;
          break;
        }
      }
      if (reachable) {
        return;
      }
      LoggerEngine.info(
        `API probe ${host} returned ${lastStatus} (attempt ${i + 1}/${delaysMs.length})`,
      );
    } catch (error) {
      lastCause = error instanceof Error ? error.message : String(error);
      if (!onGitHub) {
        throw new Error(
          `API is not reachable at ${baseURL} (${lastCause}). ` +
            "Start the local backend on port 3000, or set BASE_URL to a running API.",
          { cause: error },
        );
      }
    }
  }

  throw new Error(
    `API host ${host} is not ready (${lastCause || `HTTP ${lastStatus}`}). ` +
      "This is not a TOTP/password problem: the login proxy returned 502/503/504 or did not connect. " +
      "Set GitHub secret BASE_URL to https://api.mdm.mppkvvcl.bestinfra.app (API origin, not the dashboard), confirm the API is up, and re-run the workflow.",
  );
}

async function probeAccessToken(accessToken: string): Promise<boolean> {
  const baseURL = normalizeApiBaseUrl(env.BASE_URL);
  const mePaths = Array.from(
    new Set([resolveApiPath("/indore/auth/me"), "/auth/me", "/indore/auth/me"]),
  );

  for (const mePath of mePaths) {
    try {
      const response = await fetch(`${baseURL}${mePath}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (response.status === 200) {
        return true;
      }
      if (response.status === 401 || response.status === 403) {
        return false;
      }
    } catch {
      // try next path
    }
  }
  return false;
}

async function globalSetup(): Promise<void> {
  dotenv.config();
  loadEnv();
  LoggerEngine.info("Global setup started");

  const runId = initRunId();
  LoggerEngine.info(`Observability runId for this run: ${runId}`);

  if (env.STRIP_INDORE_PREFIX || isStripIndorePrefixEnabled()) {
    LoggerEngine.info(
      "Paths rewrite /indore/... → /... (STRIP_INDORE_PREFIX or live MPPKVVCL API host)",
    );
  }
  ensureDirectory("logs");
  ensureDirectory("reports");
  ensureDirectory("test-results");
  ensureDirectory(path.join("playwright", ".auth"));
  TokenManager.clearStaleLock();
  await assertApiReachable();

  // One Playwright process = one module/smoke command.
  // Flow: restore warm token for THIS run if still valid → else login once (captcha+OTP)
  // → TokenManager seeds session → every test in this process reuses/refreshes that token.
  // Next `npm run test:<module>` (next CI matrix job) starts a new process and repeats.
  const cachedSession = TokenManager.loadValidSession();
  if (cachedSession) {
    const stillValid = await probeAccessToken(cachedSession.accessToken);
    if (stillValid) {
      TokenManager.seed(
        cachedSession.accessToken,
        cachedSession.expiresInSeconds,
        cachedSession.csrfToken,
      );
      const msg =
        "Session reused for this suite (access token still valid). " +
        "Captcha/OTP only on cold login; all tests in this run reuse the same token.";
      LoggerEngine.info("Global setup reused valid cached auth token");
      console.error(msg);
      LoggerEngine.info("Global setup completed");
      return;
    }
    TokenManager.discardStoredSession();
    console.error(
      "Cached access token rejected by GET /auth/me (expired or revoked). Logging in once for this suite.",
    );
    LoggerEngine.info("Global setup discarded stale cached auth token");
  }

  console.error(
    "Global setup: login once for this suite (captcha + OTP). Remaining tests reuse the session.",
  );
  const login = await AuthApi.login();
  if (!login.accessToken) {
    throw new Error("Auth warmup failed: missing access token");
  }

  TokenManager.seed(login.accessToken, login.expiresIn, login.csrfToken);

  const loginOk = await probeAccessToken(login.accessToken);
  if (!loginOk) {
    TokenManager.discardStoredSession();
    throw new Error(
      "Login returned an access token that GET /auth/me rejects (INVALID_TOKEN). " +
        "Often caused by device-limit session thrash — wait a minute, clear other dashboard sessions, and re-run.",
    );
  }

  LoggerEngine.info("Global setup completed");
}

export default globalSetup;
