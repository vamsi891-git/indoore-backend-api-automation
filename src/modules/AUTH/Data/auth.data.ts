export const AuthPaths = {
  login: "/indore/auth/login",
  refresh: "/indore/auth/refresh",
  releaseDevice: "/indore/auth/login/release-device",
  invite: "/indore/auth/invite",
  invitePreview: "/indore/auth/invite/preview",
  inviteAccept: "/indore/auth/invite/accept",
  invitationsMine: "/indore/auth/invitations/mine",
  invitationById: (invitationId: string) =>
    `/indore/auth/invitations/${invitationId}`,
  invitationResend: (invitationId: string) =>
    `/indore/auth/invitations/${invitationId}/resend`,
  roles: "/indore/permissions/roles",
} as const;

function resolveEmail(): string {
  return (process.env.EMAIL ?? process.env.USERNAME ?? "").trim();
}

export const AuthTestData = {
  paths: AuthPaths,
  maxResponseTimeMs: 30_000,
  minExpiresInSeconds: 60,
  invalidPassword: "invalid-password-for-automation",
  invalidEmail: "not-a-valid-automation-user@example.com",
  expectedInvalidCredentialsStatus: 401,
  expectedInvalidCredentialsCode: "INVALID_CREDENTIALS",
  get validEmail(): string {
    return resolveEmail();
  },
  get validPassword(): string {
    return (process.env.PASSWORD ?? "").trim();
  },
  get hasValidCredentials(): boolean {
    return Boolean(this.validEmail && this.validPassword);
  },
};
