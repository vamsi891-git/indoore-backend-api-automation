import { APIRequestContext, request } from "@playwright/test";
import { InviteAcceptPayload, InviteApi, InvitePublicApi } from "../Api/invite.api";
import { AuthenticationApi } from "../Api/auth.api";
import { AuthMapper } from "../Mapper/auth.mapper";
import { ApiCallResult } from "../../../core/models/api-result.model";
import { InviteMapper } from "../Mapper/invite.mapper";
import {
  beginFreshInviteE2eRun,
  buildUniqueInviteEmail,
  captureAndPublishInviteTokenFromGmail,
  describeMissingInviteTokenSetup,
  InviteTestData,
  isAcceptSuccessStatus,
  isGmailInviteCaptureConfigured,
  normalizeInviteEmail,
  resolveInviteInboxEmail,
} from "../Data/invite.data";
import { InviteUserResponseSchema } from "../schemas/auth.schemas";
import {
  deleteWithAutoRefresh,
  getWithAutoRefresh,
  patchWithAutoRefresh,
  postWithAutoRefresh,
  putWithAutoRefresh,
} from "../../../core/utils/authenticated.request";
import { LoggerEngine } from "../../../core/engine/logger.engine";
import {
  loadSharedInviteTokenContext,
  publishCapturedInviteTokenContext,
  publishSharedInviteTokenContext,
} from "./invite-token.store";

export interface ProvisionedPendingInvite {
  email: string;
  invitationId: string;
  role: string;
  token: string;
  expiresAt?: string;
}

const MIN_INVITE_POST_SPACING_MS =
  Number(process.env.INVITE_POST_MIN_SPACING_MS) || 20_000;
const INVITE_POST_MAX_RETRIES =
  Number(process.env.INVITE_POST_MAX_RETRIES) || 4;
const INVITE_POST_RETRY_BACKOFF_MS = [0, 20_000, 40_000, 60_000];
const INVITE_ACCEPT_MAX_RETRIES =
  Number(process.env.INVITE_ACCEPT_MAX_RETRIES) || 5;
const INVITE_ACCEPT_RETRY_BACKOFF_MS = [
  0, 30_000, 60_000, 90_000, 120_000,
];

/** Playwright default test timeout is 240s — keep invite retry budget under that. */
export const INVITE_PROVISION_TEST_TIMEOUT_MS =
  Number(process.env.INVITE_PROVISION_TEST_TIMEOUT_MS) || 360_000;

let invitePostChain: Promise<unknown> = Promise.resolve();
let lastInvitePostFinishedAt = 0;

/** Gmail plus-addressed automation invites (e.g. user+e2e-invite-123@gmail.com). */
function isAutomationInviteEmail(email: string): boolean {
  const normalized = normalizeInviteEmail(email);
  const inbox = resolveInviteInboxEmail();

  if (inbox) {
    const at = inbox.lastIndexOf("@");
    if (at > 0) {
      const domain = inbox.slice(at + 1);
      if (normalized.endsWith(`@${domain}`) && normalized.includes("+")) {
        return true;
      }
    }
  }

  return (
    normalized.includes("+automation") ||
    normalized.includes("automation+") ||
    normalized.endsWith("@example.com")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithInvitePostLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = invitePostChain.then(async () => {
    const elapsed = Date.now() - lastInvitePostFinishedAt;
    if (lastInvitePostFinishedAt > 0 && elapsed < MIN_INVITE_POST_SPACING_MS) {
      await sleep(MIN_INVITE_POST_SPACING_MS - elapsed);
    }
    return fn();
  });
  invitePostChain = run.catch(() => undefined);
  try {
    return await run;
  } finally {
    lastInvitePostFinishedAt = Date.now();
  }
}

/** Serialized invite POST with spacing and retry on 429/503 rate limits. */
export async function inviteUserWithRetry(
  api: InviteApi,
  payload: { email: string; role: string },
): Promise<ApiCallResult> {
  return runWithInvitePostLock(async () => {
    let lastResponse: ApiCallResult | null = null;

    for (let attempt = 0; attempt < INVITE_POST_MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const wait =
          INVITE_POST_RETRY_BACKOFF_MS[attempt] ??
          INVITE_POST_RETRY_BACKOFF_MS.at(-1)!;
        LoggerEngine.info(
          `Invite POST retry ${attempt}/${INVITE_POST_MAX_RETRIES - 1} after ${wait}ms`,
        );
        await sleep(wait);
      }

      lastResponse = await api.inviteUser(payload);
      const status = lastResponse.rawResponse.status();
      if (status === 201) {
        return lastResponse;
      }
      if (status !== 429 && status !== 503) {
        return lastResponse;
      }
      LoggerEngine.info(
        `Invite POST returned ${status}, will retry if attempts remain`,
      );
    }

    return lastResponse!;
  });
}

/** Serialized accept POST with spacing and retry on 429/503 rate limits. */
export async function acceptInvitationWithRetry(
  publicCtx: APIRequestContext,
  payload: InviteAcceptPayload,
): Promise<ApiCallResult> {
  const publicApi = new InvitePublicApi(publicCtx);
  const authApi = new AuthenticationApi(publicCtx);

  return runWithInvitePostLock(async () => {
    let lastResponse: ApiCallResult | null = null;

    for (let attempt = 0; attempt < INVITE_ACCEPT_MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const wait =
          INVITE_ACCEPT_RETRY_BACKOFF_MS[attempt] ??
          INVITE_ACCEPT_RETRY_BACKOFF_MS.at(-1)!;
        LoggerEngine.info(
          `Accept POST retry ${attempt}/${INVITE_ACCEPT_MAX_RETRIES - 1} after ${wait}ms`,
        );
        await sleep(wait);
      }

      await authApi.getLoginPreflight();
      const csrfToken = await AuthMapper.resolveCsrfToken(publicCtx, {});
      lastResponse = await publicApi.acceptInvitation(payload, csrfToken);
      const status = lastResponse.rawResponse.status();

      if (isAcceptSuccessStatus(status)) {
        return lastResponse;
      }
      if (status !== 429 && status !== 503) {
        return lastResponse;
      }
      LoggerEngine.info(
        `Accept POST returned ${status}, will retry if attempts remain`,
      );
    }

    return lastResponse!;
  });
}

/** Copy shared invite into process env + invite-token.json for read-only specs. */
export function hydrateProcessFromSharedInviteStore(): boolean {
  const shared = loadSharedInviteTokenContext();
  if (!shared) {
    return false;
  }

  publishCapturedInviteTokenContext({
    token: shared.token,
    email: shared.email,
    invitationId: shared.invitationId,
    role: shared.role,
  });
  return true;
}

/** Reuse an existing pending automation invite from mine list when rate-limited. */
export async function findReusablePendingInvitation(
  api: InviteApi,
  options: { excludeInvitationIds?: string[] } = {},
): Promise<{ invitationId: string; email: string; role?: string } | null> {
  const shared = loadSharedInviteTokenContext();
  const excluded = new Set(
    [
      shared?.invitationId,
      ...(options.excludeInvitationIds ?? []),
    ].filter((id): id is string => Boolean(id)),
  );

  const listResponse = await api.listMyInvitations({
    page: 1,
    limit: InviteTestData.e2eListScanLimit,
    status: "pending",
  });

  const invitations =
    (
      listResponse.responseBody as {
        data?: {
          invitations?: Array<{ id: string; email?: string; role?: string }>;
        };
      }
    )?.data?.invitations ?? [];

  const eligible = invitations.filter((row) => row.id && !excluded.has(row.id));

  let candidate = eligible.find(
    (row) => row.email && isAutomationInviteEmail(row.email),
  );

  // Fallback: any pending invite (e.g. older runs used @example.com)
  if (!candidate && eligible.length > 0) {
    candidate = eligible.find((row) => row.email && row.id);
    if (candidate) {
      LoggerEngine.info(
        `Reusing newest pending invite ${candidate.id} (${candidate.email})`,
      );
    }
  }

  if (!candidate?.id || !candidate.email) {
    return null;
  }

  return {
    invitationId: candidate.id,
    email: candidate.email,
    role: candidate.role,
  };
}

const GMAIL_ADOPT_SENT_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * When POST /invite returns 429, adopt an existing pending invite instead of sending another.
 * Tries invite-token-shared.json first, then scans mine list + Gmail recapture.
 */
export async function adoptInviteForE2eWhenRateLimited(
  api: InviteApi,
): Promise<ProvisionedPendingInvite | null> {
  if (!isGmailInviteCaptureConfigured()) {
    return null;
  }

  const shared = loadSharedInviteTokenContext();
  if (shared) {
    const lookup = await api.findInvitationInMyList(shared.invitationId);
    const status = (lookup.item as { status?: string } | null)?.status;
    if (status === "pending") {
      publishCapturedInviteTokenContext({
        token: shared.token,
        email: shared.email,
        invitationId: shared.invitationId,
        role: shared.role,
      });
      LoggerEngine.info(
        `E2E adopted shared pending invite ${shared.invitationId}`,
      );
      return {
        email: shared.email,
        invitationId: shared.invitationId,
        role: shared.role,
        token: shared.token,
      };
    }
  }

  const pending = await findReusablePendingInvitation(api);
  if (!pending) {
    return null;
  }

  const rolesResponse = await api.getRoles();
  const role =
    pending.role ??
    InviteMapper.resolveInvitableRole(
      rolesResponse.responseBody,
      InviteTestData.preferredRoles,
      InviteTestData.fallbackRole,
    );

  try {
    const token = await captureAndPublishInviteTokenFromGmail({
      recipientEmail: pending.email,
      invitationId: pending.invitationId,
      role,
      sentAfter: new Date(Date.now() - GMAIL_ADOPT_SENT_AFTER_MS),
    });
    LoggerEngine.info(
      `E2E adopted pending invite ${pending.invitationId} via Gmail recapture`,
    );
    return {
      email: normalizeInviteEmail(pending.email),
      invitationId: pending.invitationId,
      role,
      token,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    LoggerEngine.info(`E2E adopt failed — Gmail recapture: ${message}`);
    return null;
  }
}

/** Load shared invite written by 00-invite-setup — does not send a new invite. */
export function requireSharedInviteFromSetup(): void {
  if (hydrateProcessFromSharedInviteStore()) {
    return;
  }
  throw new Error(
    "Shared invite token missing. Ensure 00-invite-setup passed, or set " +
      "INVITE_ACCEPT_TOKEN + INVITE_E2E_EMAIL + INVITE_E2E_INVITATION_ID in .env",
  );
}

export async function createAuthenticatedApiContext(): Promise<APIRequestContext> {
  if (!process.env.BASE_URL) {
    throw new Error("BASE_URL missing in environment");
  }

  const apiContext = await request.newContext({
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: { Accept: "application/json" },
  });

  return {
    ...apiContext,
    get: (url: string, options?: unknown) =>
      getWithAutoRefresh(
        apiContext,
        url,
        options as Parameters<typeof getWithAutoRefresh>[2],
      ),
    post: (url: string, options?: unknown) =>
      postWithAutoRefresh(
        apiContext,
        url,
        options as Parameters<typeof postWithAutoRefresh>[2],
      ),
    put: (url: string, options?: unknown) =>
      putWithAutoRefresh(
        apiContext,
        url,
        options as Parameters<typeof putWithAutoRefresh>[2],
      ),
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
    dispose: () => apiContext.dispose(),
  } as APIRequestContext;
}

async function sendInviteAndCaptureToken(
  authenticatedApi: APIRequestContext,
  prefix: string,
): Promise<ProvisionedPendingInvite> {
  if (!isGmailInviteCaptureConfigured()) {
    throw new Error(describeMissingInviteTokenSetup());
  }

  const api = new InviteApi(authenticatedApi);
  const rolesResponse = await api.getRoles();
  const role = InviteMapper.resolveInvitableRole(
    rolesResponse.responseBody,
    InviteTestData.preferredRoles,
    InviteTestData.fallbackRole,
  );
  const email = buildUniqueInviteEmail(prefix);
  const sentAfter = new Date();

  const inviteResponse = await inviteUserWithRetry(api, { email, role });
  const status = inviteResponse.rawResponse.status();
  if (status !== 201) {
    throw new Error(
      `POST /indore/auth/invite failed with status ${status}: ${JSON.stringify(inviteResponse.responseBody)}`,
    );
  }

  const parsed = InviteUserResponseSchema.parse(inviteResponse.responseBody);
  const invitationId = parsed.data.invitationId;
  const expiresAt = parsed.data.expiresAt;

  const token = await captureAndPublishInviteTokenFromGmail({
    recipientEmail: email,
    invitationId,
    role,
    sentAfter,
  });

  return {
    email: normalizeInviteEmail(email),
    invitationId,
    role,
    token,
    expiresAt,
  };
}

/**
 * One shared pending invite for preview + validate (global setup).
 * Persists to invite-token-shared.json so worker processes can read it.
 */
export async function provisionSharedPendingInvite(
  authenticatedApi: APIRequestContext,
): Promise<ProvisionedPendingInvite> {
  const provisioned = await sendInviteAndCaptureToken(
    authenticatedApi,
    "shared-preview-validate",
  );

  if (provisioned.expiresAt) {
    process.env.INVITE_E2E_EXPIRES_AT = provisioned.expiresAt;
  }

  publishSharedInviteTokenContext({
    token: provisioned.token,
    email: provisioned.email,
    invitationId: provisioned.invitationId,
    role: provisioned.role,
  });

  return provisioned;
}

function shouldForceFreshSharedInvite(): boolean {
  const flag = process.env.INVITE_FORCE_FRESH?.trim().toLowerCase();
  return flag === "true" || flag === "1" || flag === "yes";
}

async function isInvitationStillPending(
  api: InviteApi,
  invitationId: string,
): Promise<boolean> {
  const lookup = await api.findInvitationInMyList(invitationId);
  return (lookup.item as { status?: string } | null)?.status === "pending";
}

/** Called from 00-invite-setup.spec.ts — provisions once per run when Gmail IMAP is configured. */
export async function ensureSharedInviteTokenForAuthSuite(
  authenticatedApi: APIRequestContext,
): Promise<ProvisionedPendingInvite | null> {
  if (!isGmailInviteCaptureConfigured()) {
    LoggerEngine.info(
      "Gmail IMAP not configured — preview/validate @e2e specs need manual INVITE_ACCEPT_TOKEN",
    );
    return null;
  }

  const api = new InviteApi(authenticatedApi);
  const cached = loadSharedInviteTokenContext();

  if (!shouldForceFreshSharedInvite() && cached) {
    if (await isInvitationStillPending(api, cached.invitationId)) {
      LoggerEngine.info(
        `Reusing shared pending invite ${cached.invitationId} from invite-token-shared.json`,
      );
      hydrateProcessFromSharedInviteStore();
      return {
        email: cached.email,
        invitationId: cached.invitationId,
        role: cached.role,
        token: cached.token,
      };
    }
    LoggerEngine.info(
      "Shared invite on disk is no longer pending — provisioning a fresh one",
    );
  }

  LoggerEngine.info("Provisioning shared pending invite for preview/validate specs");
  try {
    return await provisionSharedPendingInvite(authenticatedApi);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("429") && !message.includes("503")) {
      throw error;
    }
    const adopted = await adoptInviteForE2eWhenRateLimited(api);
    if (!adopted) {
      throw error;
    }
    publishSharedInviteTokenContext({
      token: adopted.token,
      email: adopted.email,
      invitationId: adopted.invitationId,
      role: adopted.role,
    });
    return adopted;
  }
}

/**
 * Reuse the shared pending invite from 00-invite-setup for accept validation.
 * Avoids an extra POST /invite immediately before the first accept in the suite.
 */
export async function prepareSharedInviteForAcceptValidate(
  authenticatedApi: APIRequestContext,
): Promise<ProvisionedPendingInvite> {
  requireSharedInviteFromSetup();
  const shared = loadSharedInviteTokenContext();
  if (!shared) {
    throw new Error("Shared invite token missing after setup hydration");
  }

  const api = new InviteApi(authenticatedApi);
  if (await isInvitationStillPending(api, shared.invitationId)) {
    publishCapturedInviteTokenContext({
      token: shared.token,
      email: shared.email,
      invitationId: shared.invitationId,
      role: shared.role,
    });
    LoggerEngine.info(
      `Accept-validate reusing shared pending invite ${shared.invitationId}`,
    );
    return {
      email: shared.email,
      invitationId: shared.invitationId,
      role: shared.role,
      token: shared.token,
    };
  }

  LoggerEngine.info(
    "Shared invite is no longer pending — provisioning dedicated accept-validate invite",
  );
  return provisionFreshPendingInvite(authenticatedApi, "accept-validate-invite");
}

/**
 * Per-spec pending invite (accept flows). Clears invite-token.json first.
 */
export async function provisionFreshPendingInvite(
  authenticatedApi: APIRequestContext,
  prefix = "spec-invite",
): Promise<ProvisionedPendingInvite> {
  beginFreshInviteE2eRun();
  const api = new InviteApi(authenticatedApi);

  const adopted = await adoptInviteForE2eWhenRateLimited(api);
  if (adopted) {
    if (adopted.expiresAt) {
      process.env.INVITE_E2E_EXPIRES_AT = adopted.expiresAt;
    }
    publishCapturedInviteTokenContext({
      token: adopted.token,
      email: adopted.email,
      invitationId: adopted.invitationId,
      role: adopted.role,
    });
    return adopted;
  }

  try {
    const provisioned = await sendInviteAndCaptureToken(authenticatedApi, prefix);

    if (provisioned.expiresAt) {
      process.env.INVITE_E2E_EXPIRES_AT = provisioned.expiresAt;
    }

    publishCapturedInviteTokenContext({
      token: provisioned.token,
      email: provisioned.email,
      invitationId: provisioned.invitationId,
      role: provisioned.role,
    });

    return provisioned;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("429") && !message.includes("503")) {
      throw error;
    }
    const fallback = await adoptInviteForE2eWhenRateLimited(api);
    if (!fallback) {
      throw error;
    }
    publishCapturedInviteTokenContext({
      token: fallback.token,
      email: fallback.email,
      invitationId: fallback.invitationId,
      role: fallback.role,
    });
    return fallback;
  }
}
