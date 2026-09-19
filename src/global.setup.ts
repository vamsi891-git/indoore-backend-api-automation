import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { AuthApi } from "./core/utils/auth.util";
import { LoggerEngine } from "./core/engine/logger.engine";
import { TokenManager } from "./core/utils/token-manager";
import { initRunId } from "./observability/logger";
import { resolveApiPath, normalizeApiBaseUrl, isStripIndorePrefixEnabled, enableStripIndorePrefix } from "./core/utils/api-path.util";

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
  const baseURL = normalizeApiBaseUrl(process.env.BASE_URL);
  const host = apiHostLabel(baseURL);
  const onGitHub = process.env.GITHUB_ACTIONS === "true";

  if (onGitHub && isPrivateOrLocalHost(host)) {
    throw new Error(
      `GitHub Actions cannot reach ${host}. Set repository secret BASE_URL to the public HTTPS API (not localhost or a VPN/LAN address).`,
    );
  }

  const delaysMs = onGitHub ? [0, 10_000, 20_000, 30_000] : [0];
  let lastStatus = 0;
  let lastCause = "";

  const isGateway = (status: number) =>
    status === 502 || status === 503 || status === 504;

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

async function globalSetup(): Promise<void> {
  dotenv.config();
  LoggerEngine.info("Global setup started");

  const runId = initRunId();
  LoggerEngine.info(`Observability runId for this run: ${runId}`);

  validateEnv();
  if (process.env.STRIP_INDORE_PREFIX?.trim() || isStripIndorePrefixEnabled()) {
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

  const cachedSession = TokenManager.loadValidSession();
  if (cachedSession) {
    TokenManager.seed(
      cachedSession.accessToken,
      cachedSession.expiresInSeconds,
      cachedSession.csrfToken,
    );
    const msg =
      "Session reused (access token still valid). Captcha and OTP run only on first login; later tests use this token, then refresh when it expires.";
    LoggerEngine.info("Global setup reused valid cached auth token");
    console.error(msg);
    LoggerEngine.info("Global setup completed");
    return;
  }

  console.error(
    "Global setup: first login for this session (captcha + OTP). Later tests reuse the token.",
  );
  const login = await AuthApi.login();
  if (!login.accessToken) {
    throw new Error("Auth warmup failed: missing access token");
  }

  TokenManager.seed(login.accessToken, login.expiresIn, login.csrfToken);
  LoggerEngine.info("Global setup completed");
}

export default globalSetup;
