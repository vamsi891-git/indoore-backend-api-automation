/**
 * Invite email token flow — one token from the invitation email powers every spec:
 *
 * 1. POST /indore/auth/invite → email contains preview/accept link with `token`
 * 2. Token source (first match wins):
 *    - Gmail IMAP auto-capture when GMAIL_IMAP_* is set (invite-e2e Step 1)
 *    - INVITE_ACCEPT_TOKEN / INVITE_ACCEPT_URL in .env (manual)
 *    - playwright/.auth/invite-token.json from the last Gmail capture (gitignored)
 * 3. Reuse across invite-e2e, invite-validate, invite-preview, invite-accept-validate
 *
 * Token is consumed on accept. invite-e2e starts a **fresh** invite every run
 * (clears invite-token.json). Set INVITE_E2E_REUSE_CONTEXT=true to re-run Steps 3–5 only.
 */
import {
  clearInviteTokenProcessEnv,
  clearStoredInviteTokenContext,
  getRuntimeInviteTokenContext,
  loadSharedInviteTokenContext,
  loadStoredInviteTokenContext,
  publishCapturedInviteTokenContext,
} from "../utils/invite-token.store";
import { captureInviteTokenFromGmail } from "../utils/invite-gmail.reader";

export const inviteEmailTokenEnvHint =
  "Set GMAIL_IMAP_USER + GMAIL_IMAP_APP_PASSWORD for auto-capture, or INVITE_ACCEPT_TOKEN + INVITE_E2E_EMAIL + INVITE_E2E_INVITATION_ID in .env";

export interface InviteE2eStateSlice {
  inviteEmail: string;
  invitationId: string;
  role: string;
}

/** Populate serial E2E state from .env when using a pre-sent email invitation. */
export function hydrateInviteE2eStateFromEnv(state: InviteE2eStateSlice): boolean {
  const ctx = resolveInviteE2eContext();
  if (!ctx) {
    return false;
  }
  state.inviteEmail = ctx.email;
  state.invitationId = ctx.invitationId;
  state.role = ctx.role;
  return true;
}

/** True when Gmail IMAP credentials are configured for invite token auto-capture. */
export function isGmailInviteCaptureConfigured(): boolean {
  return Boolean(
    process.env.GMAIL_IMAP_USER?.trim() &&
      process.env.GMAIL_IMAP_APP_PASSWORD?.trim(),
  );
}

/**
 * True when a pending invite token is available without Gmail IMAP —
 * from gitignored `playwright/.auth/invite-token-shared.json`,
 * `invite-token.json`, or INVITE_ACCEPT_TOKEN / INVITE_E2E_* in .env.
 */
export function hasGitignoredInviteTokenContext(): boolean {
  if (loadSharedInviteTokenContext()) {
    return true;
  }
  return hasInviteE2eContext();
}

/** Invites to @example.com are API-only smoke addresses (no real inbox). */
export function isDisposableInviteEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith("@example.com");
}

export function describeMissingInviteTokenSetup(): string {
  if (isGmailInviteCaptureConfigured()) {
    return (
      "Gmail IMAP is set but no token was captured — check delivery, spam, or " +
      "GMAIL_INVITE_CAPTURE_TIMEOUT_MS"
    );
  }
  return (
    "Add GMAIL_IMAP_USER + GMAIL_IMAP_APP_PASSWORD to .env for auto-capture, " +
    "or set INVITE_ACCEPT_TOKEN from the invite email link"
  );
}

/** True when the email-token + invitation context is fully configured in .env */
export function hasInviteEmailTokenFlow(): boolean {
  return hasInviteE2eContext();
}

/**
 * When true, invite-e2e Step 1 skips sending a new invite and reuses .env / stored context
 * (for re-running preview/accept only). Default: false — each e2e run sends a new invite.
 */
export function shouldReuseManualInviteContext(): boolean {
  const reuse = process.env.INVITE_E2E_REUSE_CONTEXT?.trim().toLowerCase();
  if (reuse !== "true" && reuse !== "1" && reuse !== "yes") {
    return false;
  }
  return hasInviteE2eContext();
}

/** Reset token store + process env so the next invite-e2e run can capture a new token. */
export function beginFreshInviteE2eRun(): void {
  clearStoredInviteTokenContext();
  clearInviteTokenProcessEnv();
}

export interface InviteTokenCaptureInput {
  recipientEmail: string;
  invitationId: string;
  role: string;
  sentAfter?: Date;
}

/**
 * Poll Gmail for the invite email, extract token, publish to process.env + invite-token.json.
 */
export async function captureAndPublishInviteTokenFromGmail(
  input: InviteTokenCaptureInput,
): Promise<string> {
  const sentAfter =
    input.sentAfter ?? new Date(Date.now() - InviteTestData.gmailCaptureSentAfterSkewMs);

  const captured = await captureInviteTokenFromGmail({
    recipientEmail: input.recipientEmail,
    sentAfter,
    invitationId: input.invitationId,
  });

  publishCapturedInviteTokenContext({
    token: captured.token,
    email: normalizeInviteEmail(input.recipientEmail),
    invitationId: input.invitationId,
    role: input.role,
  });

  return captured.token;
}

export const InviteTestData = {
  maxResponseTimeMs: 30_000,
  /** Default role when roles catalog is unavailable */
  fallbackRole: "Manager",
  /** Prefer non-ultimate roles for invite smoke tests */
  preferredRoles: ["Manager", "User", "Admin"] as const,
  invalidRole: "not-a-real-role-name",
  invalidPreviewToken: "invalid-token-probe-1234567890",
  shortPreviewToken: "too-short",
  inviteExpiryToleranceMs: 5 * 60_000,
  resendCooldownCodes: ["INVITE_RESEND_COOLDOWN"] as const,
  previewErrorCodes: {
    invalid: "INVITE_INVALID",
    expired: "INVITE_EXPIRED",
    used: "INVITE_ALREADY_USED",
  } as const,
  acceptErrorCodes: {
    invalid: "INVITE_INVALID",
    expired: "INVITE_EXPIRED",
    used: "INVITE_ALREADY_USED",
    emailExists: "EMAIL_EXISTS",
  } as const,
  deleteErrorCodes: {
    notFound: "INVITE_NOT_FOUND",
  } as const,
  /** Probe ID for DELETE /invitations/:id negative test */
  notFoundInvitationId: "00000000-0000-4000-8000-000000000099",
  listStatuses: ["all", "pending", "accepted", "expired"] as const,
  listPage: 1,
  listLimit: 20,
  acceptPayload: {
    password: "Automation@Invite123",
    firstName: "Automation",
    lastName: "Invitee",
    phone: "9876543210",
    designation: "QA Engineer",
  },
  /** E2E list scan page size when resolving invitation by ID */
  e2eListScanLimit: 100,
  /** Default access token TTL returned on accept */
  defaultAcceptExpiresInSec: 900,
  /** Live API returns 201 Created on successful accept */
  acceptSuccessStatuses: [200, 201] as const,
  /** Admin role permissions expected after invite accept (subset) */
  adminAcceptPermissionSamples: [
    "user_management.view",
    "user_invitations.create",
    "user_invitations.view_own",
    "roles_permissions.view",
    "consumers.view",
    "billing.view",
  ] as const,
  /** Clock skew when searching Gmail for messages sent just before capture starts */
  gmailCaptureSentAfterSkewMs: 30_000,
};

export interface InviteAcceptPayloadInput {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  designation?: string;
}

export function resolveInviteAcceptPayload(): InviteAcceptPayloadInput | null {
  const token = resolveInviteAcceptToken();
  if (!token) {
    return null;
  }

  return {
    token,
    password: resolveInviteE2ePassword(),
    firstName:
      process.env.INVITE_E2E_FIRST_NAME?.trim() ||
      InviteTestData.acceptPayload.firstName,
    lastName:
      process.env.INVITE_E2E_LAST_NAME?.trim() ||
      InviteTestData.acceptPayload.lastName,
    phone:
      process.env.INVITE_E2E_PHONE?.trim() || InviteTestData.acceptPayload.phone,
    designation:
      process.env.INVITE_E2E_DESIGNATION?.trim() ||
      InviteTestData.acceptPayload.designation,
  };
}

export function hasInviteAcceptPayload(): boolean {
  return resolveInviteAcceptPayload() !== null;
}

export function resolveInviteE2ePassword(): string {
  return (
    process.env.INVITE_E2E_PASSWORD?.trim() ||
    InviteTestData.acceptPayload.password
  );
}

function resolveInviteTokenFromEnvOrStore(): string | null {
  const runtime = getRuntimeInviteTokenContext();
  if (runtime?.token && runtime.token.length >= 20) {
    return runtime.token;
  }

  const stored = loadStoredInviteTokenContext();
  if (stored?.token && stored.token.length >= 20) {
    return stored.token;
  }

  return null;
}

/** Single invite token from the email link (`?token=`). Shared by all invite specs. */
export function resolveInviteAcceptToken(): string | null {
  const direct = process.env.INVITE_ACCEPT_TOKEN?.trim();
  if (direct && direct.length >= 20) {
    return direct;
  }

  const urlValue = process.env.INVITE_ACCEPT_URL?.trim();
  if (urlValue) {
    try {
      const parsed = new URL(urlValue);
      const fromQuery =
        parsed.searchParams.get("token") ??
        parsed.searchParams.get("inviteToken");
      if (fromQuery && fromQuery.length >= 20) {
        return fromQuery;
      }
    } catch {
      if (urlValue.length >= 20) {
        return urlValue;
      }
    }
  }

  return resolveInviteTokenFromEnvOrStore();
}

export function hasInviteAcceptToken(): boolean {
  return resolveInviteAcceptToken() !== null;
}

/** Context from a real invite (POST /invite response + email link token). */
export interface InviteE2eContext {
  token: string;
  email: string;
  invitationId: string;
  role: string;
  expiresAt?: string;
}

export function resolveInviteE2eContext(): InviteE2eContext | null {
  const token = resolveInviteAcceptToken();
  const stored = getRuntimeInviteTokenContext() ?? loadStoredInviteTokenContext();

  const email =
    process.env.INVITE_E2E_EMAIL?.trim().toLowerCase() ?? stored?.email;
  const invitationId =
    process.env.INVITE_E2E_INVITATION_ID?.trim() ?? stored?.invitationId;
  const role = process.env.INVITE_E2E_ROLE?.trim() ?? stored?.role;

  if (!token || !email || !invitationId) {
    return null;
  }

  return {
    token,
    email,
    invitationId,
    role: role || InviteTestData.fallbackRole,
    expiresAt: process.env.INVITE_E2E_EXPIRES_AT?.trim(),
  };
}

export function hasInviteE2eContext(): boolean {
  return resolveInviteE2eContext() !== null;
}

/** Invitation metadata persisted after accept (token is cleared but email/id remain). */
export interface InviteE2eMetadata {
  email: string;
  invitationId: string;
  role: string;
  expiresAt?: string;
}

export function resolveInviteE2eMetadata(): InviteE2eMetadata | null {
  const stored =
    getRuntimeInviteTokenContext() ?? loadStoredInviteTokenContext();

  const email =
    process.env.INVITE_E2E_EMAIL?.trim().toLowerCase() ?? stored?.email;
  const invitationId =
    process.env.INVITE_E2E_INVITATION_ID?.trim() ?? stored?.invitationId;
  const role = process.env.INVITE_E2E_ROLE?.trim() ?? stored?.role;
  const expiresAt = process.env.INVITE_E2E_EXPIRES_AT?.trim();

  if (!email || !invitationId) {
    return null;
  }

  return {
    email,
    invitationId,
    role: role || InviteTestData.fallbackRole,
    expiresAt: expiresAt || undefined,
  };
}

export function hasInviteE2eMetadata(): boolean {
  return resolveInviteE2eMetadata() !== null;
}

/**
 * Inbox that receives invite emails. Override with INVITE_INBOX_EMAIL in .env;
 * defaults to GMAIL_IMAP_USER (must be a mailbox you can read via IMAP).
 */
export function resolveInviteInboxEmail(): string | null {
  const override = process.env.INVITE_INBOX_EMAIL?.trim().toLowerCase();
  if (override) {
    return override;
  }
  return process.env.GMAIL_IMAP_USER?.trim().toLowerCase() ?? null;
}

/**
 * Invitee address for automation. With Gmail capture, uses plus-addressing on the invite inbox
 * (e.g. user+e2e-invite-123@gmail.com → lands in the same Gmail inbox).
 */
export function buildUniqueInviteEmail(prefix = "automation-invite"): string {
  const inbox = resolveInviteInboxEmail();
  if (inbox && isGmailInviteCaptureConfigured()) {
    const at = inbox.lastIndexOf("@");
    if (at > 0) {
      const local = inbox.slice(0, at);
      const domain = inbox.slice(at + 1);
      return `${local}+${prefix}-${Date.now()}@${domain}`;
    }
  }
  return `${prefix}-${Date.now()}@example.com`;
}

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isInviteAlreadyUsedResponse(
  status: number,
  body: { success?: boolean; error?: { code?: string } },
): boolean {
  return (
    [401, 409].includes(status) &&
    body.success === false &&
    body.error?.code === InviteTestData.acceptErrorCodes.used
  );
}

export function isRateLimitedResponse(
  status: number,
  body: { success?: boolean; error?: { code?: string } },
): boolean {
  return (
    status === 429 &&
    body.success === false &&
    body.error?.code === "TOO_MANY_REQUESTS"
  );
}

export function isInvitePreviewAlreadyUsedResponse(
  status: number,
  body: { success?: boolean; error?: { code?: string } },
): boolean {
  return (
    status === 409 &&
    body.success === false &&
    body.error?.code === InviteTestData.acceptErrorCodes.used
  );
}

export function isAcceptSuccessStatus(status: number): boolean {
  return (InviteTestData.acceptSuccessStatuses as readonly number[]).includes(
    status,
  );
}
