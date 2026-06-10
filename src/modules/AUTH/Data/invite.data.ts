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
};

export function buildUniqueInviteEmail(prefix = "automation-invite"): string {
  return `${prefix}-${Date.now()}@example.com`;
}

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}
