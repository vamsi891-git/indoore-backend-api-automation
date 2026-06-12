import fs from "fs";
import path from "path";

export interface StoredInviteTokenContext {
  token: string;
  email: string;
  invitationId: string;
  role: string;
  capturedAt: string;
}

const authDir = path.join(process.cwd(), "playwright", ".auth");
const storePath = path.join(authDir, "invite-token.json");
const sharedStorePath = path.join(authDir, "invite-token-shared.json");
const suiteAcceptPath = path.join(authDir, "invite-suite-accept.json");

export interface SuiteAcceptSnapshot {
  completedAt: string;
  invitationId: string;
  email: string;
  role: string;
  userId: string;
  status: number;
  responseBody: unknown;
  responseTime: number;
}

let runtimeContext: StoredInviteTokenContext | null = null;
let sharedRuntimeContext: StoredInviteTokenContext | null = null;

function ensureAuthDir(): void {
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
}

export function getRuntimeInviteTokenContext(): StoredInviteTokenContext | null {
  return runtimeContext;
}

function readTokenContextFromFile(
  filePath: string,
): StoredInviteTokenContext | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    ) as StoredInviteTokenContext;
    if (!parsed.token || parsed.token.length < 20) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function loadStoredInviteTokenContext(): StoredInviteTokenContext | null {
  return readTokenContextFromFile(storePath);
}

export function loadSharedInviteTokenContext(): StoredInviteTokenContext | null {
  if (sharedRuntimeContext) {
    return sharedRuntimeContext;
  }
  return readTokenContextFromFile(sharedStorePath);
}

/** Publish token for the current process and persist under playwright/.auth/ (gitignored). */
export function publishCapturedInviteTokenContext(
  context: Omit<StoredInviteTokenContext, "capturedAt">,
): StoredInviteTokenContext {
  const stored: StoredInviteTokenContext = {
    ...context,
    capturedAt: new Date().toISOString(),
  };

  runtimeContext = stored;
  process.env.INVITE_ACCEPT_TOKEN = stored.token;
  process.env.INVITE_E2E_EMAIL = stored.email;
  process.env.INVITE_E2E_INVITATION_ID = stored.invitationId;
  process.env.INVITE_E2E_ROLE = stored.role;

  ensureAuthDir();
  fs.writeFileSync(storePath, JSON.stringify(stored, null, 2), "utf8");

  return stored;
}

/** Shared pending invite for preview/validate — survives per-spec token consumption. */
export function publishSharedInviteTokenContext(
  context: Omit<StoredInviteTokenContext, "capturedAt">,
): StoredInviteTokenContext {
  const stored: StoredInviteTokenContext = {
    ...context,
    capturedAt: new Date().toISOString(),
  };

  sharedRuntimeContext = stored;
  ensureAuthDir();
  fs.writeFileSync(sharedStorePath, JSON.stringify(stored, null, 2), "utf8");

  return stored;
}

export function clearStoredInviteTokenContext(): void {
  runtimeContext = null;
  if (fs.existsSync(storePath)) {
    fs.unlinkSync(storePath);
  }
}

/** Clear in-process invite token env (does not edit .env on disk). */
export function clearInviteTokenProcessEnv(): void {
  delete process.env.INVITE_ACCEPT_TOKEN;
  delete process.env.INVITE_ACCEPT_URL;
  delete process.env.INVITE_E2E_EMAIL;
  delete process.env.INVITE_E2E_INVITATION_ID;
  delete process.env.INVITE_E2E_ROLE;
  delete process.env.INVITE_E2E_EXPIRES_AT;
}

export function clearSuiteAcceptSnapshot(): void {
  if (fs.existsSync(suiteAcceptPath)) {
    fs.unlinkSync(suiteAcceptPath);
  }
}

export function publishSuiteAcceptSnapshot(
  snapshot: Omit<SuiteAcceptSnapshot, "completedAt">,
): SuiteAcceptSnapshot {
  const stored: SuiteAcceptSnapshot = {
    ...snapshot,
    completedAt: new Date().toISOString(),
  };
  ensureAuthDir();
  fs.writeFileSync(suiteAcceptPath, JSON.stringify(stored, null, 2), "utf8");
  return stored;
}

export function loadSuiteAcceptSnapshot(): SuiteAcceptSnapshot | null {
  if (!fs.existsSync(suiteAcceptPath)) {
    return null;
  }
  try {
    return JSON.parse(
      fs.readFileSync(suiteAcceptPath, "utf8"),
    ) as SuiteAcceptSnapshot;
  } catch {
    return null;
  }
}

export function hasSuiteAcceptSnapshot(): boolean {
  return loadSuiteAcceptSnapshot() !== null;
}

/** After accept — token is one-time; clear so later specs do not reuse a consumed token. */
export function markInviteAcceptTokenConsumed(): void {
  runtimeContext = null;
  if (fs.existsSync(storePath)) {
    fs.unlinkSync(storePath);
  }
  delete process.env.INVITE_ACCEPT_TOKEN;
  delete process.env.INVITE_ACCEPT_URL;
}
