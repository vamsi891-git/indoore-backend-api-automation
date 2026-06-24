import { z } from "zod";

export const AuthErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const AuthErrorResponseSchema = z.object({
  success: z.literal(false),
  error: AuthErrorSchema,
});

const AuthDeviceSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().nullable().optional(),
    deviceType: z.string().optional(),
    browser: z.string().nullable().optional(),
    os: z.string().nullable().optional(),
    lastSeenAt: z.string().nullable().optional(),
    trustedAt: z.string().nullable().optional(),
  })
  .passthrough();

export const AuthLoginSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive().optional(),
});

export const AuthDeviceSelectionSchema = z.object({
  requiresDeviceSelection: z.literal(true),
  challengeToken: z.string().min(1),
  expiresIn: z.number().int().positive().optional(),
  maxDevices: z.number().int().positive().optional(),
  devices: z.array(AuthDeviceSchema).min(1),
});

export const AuthLoginDataSchema = z.union([
  AuthLoginSessionSchema,
  AuthDeviceSelectionSchema,
]);

export const AuthLoginSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: AuthLoginDataSchema,
});

export const AuthRefreshSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive().optional(),
  tokenType: z.string().min(1).optional(),
});

export const AuthRefreshSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: AuthRefreshSessionSchema,
});

export type AuthLoginSuccessResponse = z.infer<
  typeof AuthLoginSuccessResponseSchema
>;
export type AuthRefreshSuccessResponse = z.infer<
  typeof AuthRefreshSuccessResponseSchema
>;
export type AuthLoginData = z.infer<typeof AuthLoginDataSchema>;
export type AuthLoginSession = z.infer<typeof AuthLoginSessionSchema>;
export type AuthDeviceSelection = z.infer<typeof AuthDeviceSelectionSchema>;

// --- Current session (GET /indore/auth/me) ---

export const AuthMeUserSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().nullable().optional(),
    phoneVerifiedAt: z.string().datetime().nullable().optional(),
    designation: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
    profileImageUrl: z.string().url().nullable().optional(),
    profileImageKey: z.string().nullable().optional(),
    profileImageViewUrl: z.string().url().nullable().optional(),
    role: z.string().min(1),
    roleSortOrder: z.number().int(),
    roleDescription: z.string().nullable().optional(),
    organisationScopeId: z.number().int().positive().nullable().optional(),
    organisationLookupId: z.number().int().positive().nullable().optional(),
    organisationScopeName: z.string().nullable().optional(),
    organizationHierarchy: z.unknown().nullable().optional(),
    networkScopeId: z.number().int().positive().nullable().optional(),
    networkLookupId: z.number().int().positive().nullable().optional(),
    networkScopeName: z.string().nullable().optional(),
    networkHierarchy: z.unknown().nullable().optional(),
    consumerId: z.string().nullable().optional(),
    consumerTblRefId: z.number().int().positive().nullable().optional(),
    createdBy: z.unknown().nullable().optional(),
    invitedBy: z.unknown().nullable().optional(),
    isTwoFactorEnabled: z.boolean(),
    isTwoFactorSetupCompleted: z.boolean(),
    isTwoFactorEnforced: z.boolean(),
    twoFactorSetupCompletedAt: z.string().datetime().nullable().optional(),
    sessionTimeoutMinutes: z.number().int().positive(),
    sessionRefreshExpiresDays: z.number().int().positive(),
    sessionAbsoluteLifetimeDays: z.number().int().positive(),
    lastPasswordChangedAt: z.string().datetime().nullable().optional(),
    lastSuccessfulLoginAt: z.string().datetime().nullable().optional(),
    lastFailedLoginAt: z.string().datetime().nullable().optional(),
    failedLoginAttempts: z.number().int().nonnegative(),
    status: z.enum(["active", "suspended"]),
    createdAt: z.string().datetime(),
    roleIsUltimate: z.boolean(),
  })
  .passthrough();

export const AuthMeDataSchema = z.object({
  user: AuthMeUserSchema,
  permissions: z.array(z.string().min(1)).min(1),
  isUltimate: z.boolean(),
  requiresMandatory2FASetup: z.boolean(),
});

export const AuthMeResponseSchema = z.object({
  success: z.literal(true),
  data: AuthMeDataSchema,
});

// --- Session devices (GET /indore/auth/devices) ---

const AuthDeviceSessionSchema = z.object({
  sessionId: z.string().min(1),
  ipAddress: z.string().min(1),
  location: z.string().min(1),
  createdAt: z.string().datetime(),
  lastActiveAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

const AuthSessionDeviceSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    deviceType: z.enum(["desktop", "mobile", "tablet"]),
    browser: z.string().nullable(),
    os: z.string().nullable(),
    userAgent: z.string().min(1),
    lastIpAddress: z.string().min(1),
    lastLocationText: z.string().min(1),
    createdAt: z.string().datetime(),
    lastSeenAt: z.string().datetime(),
    trustedAt: z.string().datetime().nullable(),
    revokedAt: z.string().datetime().nullable(),
    isCurrentDevice: z.boolean(),
    sessions: z.array(AuthDeviceSessionSchema).min(1),
  })
  .passthrough();

const AuthDeviceGroupSchema = z.object({
  osKey: z.string().min(1),
  osLabel: z.string().min(1),
  deviceCount: z.number().int().nonnegative(),
  activeSessionCount: z.number().int().nonnegative(),
  lastSeenAt: z.string().datetime().nullable(),
  hasCurrentDevice: z.boolean(),
  devices: z.array(AuthSessionDeviceSchema),
});

export const AuthDevicesDataSchema = z.object({
  deviceGroups: z.array(AuthDeviceGroupSchema),
  unlinkedSessions: z.array(AuthDeviceSessionSchema),
});

export const AuthDevicesResponseSchema = z.object({
  success: z.literal(true),
  data: AuthDevicesDataSchema,
});

// --- Revoke session device (DELETE /indore/auth/devices/:id) ---

export const AuthDeleteDeviceDataSchema = z.object({
  deviceId: z.string().uuid(),
  familiesRevoked: z.number().int().nonnegative(),
  refreshRowsRevoked: z.number().int().nonnegative(),
});

export const AuthDeleteDeviceResponseSchema = z.object({
  success: z.literal(true),
  data: AuthDeleteDeviceDataSchema,
});

export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;
export type AuthMeData = z.infer<typeof AuthMeDataSchema>;
export type AuthMeUser = z.infer<typeof AuthMeUserSchema>;
export type AuthDevicesResponse = z.infer<typeof AuthDevicesResponseSchema>;
export type AuthDeleteDeviceResponse = z.infer<
  typeof AuthDeleteDeviceResponseSchema
>;

export function isDeviceSelectionPayload(
  data: AuthLoginData,
): data is AuthDeviceSelection {
  return "requiresDeviceSelection" in data && data.requiresDeviceSelection === true;
}

export function isLoginSessionPayload(
  data: AuthLoginData,
): data is AuthLoginSession {
  return "accessToken" in data;
}

// --- Invite user (POST /indore/auth/invite) ---

export const InviteUserDataSchema = z.object({
  invitationId: z.string().uuid(),
  email: z.string().email().max(320),
  expiresAt: z.string().datetime(),
  replacedPendingInvitation: z.boolean(),
  emailSent: z.boolean(),
});

export const InviteUserResponseSchema = z.object({
  success: z.literal(true),
  data: InviteUserDataSchema,
});

export const InviteUserRequestSchema = z.object({
  email: z.string().trim().email().max(320),
  role: z.string().trim().min(1).max(50),
  organisationId: z.coerce.number().int().positive().optional(),
  networkId: z.coerce.number().int().positive().optional(),
});

// --- List sent invitations (GET /indore/auth/invitations/mine) ---

export const SentInvitationItemSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.string().min(1),
    status: z.enum(["pending", "accepted", "expired"]),
    isExpired: z.boolean(),
    expiresInSec: z.number().int().nullable(),
    expiresAt: z.string().datetime(),
    acceptedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    organisationScopeId: z.number().int().positive().nullable(),
    organisationScopeName: z.string().nullable(),
    organisationScopeLevelName: z.string().nullable(),
    networkScopeId: z.number().int().positive().nullable(),
    networkScopeName: z.string().nullable(),
    networkScopeLevelName: z.string().nullable(),
  })
  .passthrough();

export const SentInvitationsListDataSchema = z.object({
  invitations: z.array(SentInvitationItemSchema),
  summary: z.object({
    total: z.number().int().nonnegative(),
    acceptedCount: z.number().int().nonnegative(),
    pendingCount: z.number().int().nonnegative(),
    expiredCount: z.number().int().nonnegative(),
  }),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  filterOptions: z.object({
    statuses: z.array(z.string()),
    roles: z.array(z.string()),
  }),
});

export const SentInvitationsListResponseSchema = z.object({
  success: z.literal(true),
  data: SentInvitationsListDataSchema,
});

// --- Preview invitation (GET /indore/auth/invite/preview) ---

export const InvitePreviewDataSchema = z
  .object({
    email: z.string().email(),
    role: z.string().min(1),
    expiresAt: z.string().datetime(),
    inviterName: z.string().optional(),
    organisationScopeName: z.string().nullable().optional(),
    networkScopeName: z.string().nullable().optional(),
  })
  .passthrough();

export const InvitePreviewResponseSchema = z.object({
  success: z.literal(true),
  data: InvitePreviewDataSchema,
});

// --- Accept invitation (POST /indore/auth/invite/accept) ---

export const InviteAcceptUserSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().nullable().optional(),
    phoneVerifiedAt: z.string().datetime().nullable().optional(),
    designation: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
    role: z.string().min(1),
    roleSortOrder: z.number().int(),
    roleDescription: z.string().nullable().optional(),
    organisationScopeId: z.number().int().positive().nullable().optional(),
    organisationLookupId: z.number().int().positive().nullable().optional(),
    organisationScopeName: z.string().nullable().optional(),
    organizationHierarchy: z.unknown().nullable().optional(),
    networkScopeId: z.number().int().positive().nullable().optional(),
    networkLookupId: z.number().int().positive().nullable().optional(),
    networkScopeName: z.string().nullable().optional(),
    networkHierarchy: z.unknown().nullable().optional(),
    consumerId: z.string().nullable().optional(),
    consumerTblRefId: z.number().int().positive().nullable().optional(),
    createdBy: z.unknown().nullable().optional(),
    invitedBy: z.unknown().nullable().optional(),
    isTwoFactorEnabled: z.boolean(),
    isTwoFactorSetupCompleted: z.boolean(),
    isTwoFactorEnforced: z.boolean(),
    twoFactorSetupCompletedAt: z.string().datetime().nullable().optional(),
    sessionTimeoutMinutes: z.number().int().positive(),
    sessionRefreshExpiresDays: z.number().int().positive(),
    sessionAbsoluteLifetimeDays: z.number().int().positive(),
    lastPasswordChangedAt: z.string().datetime().nullable().optional(),
    lastSuccessfulLoginAt: z.string().datetime().nullable().optional(),
    lastFailedLoginAt: z.string().datetime().nullable().optional(),
    failedLoginAttempts: z.number().int().nonnegative(),
    status: z.enum(["active", "suspended"]),
    createdAt: z.string().datetime(),
    roleIsUltimate: z.boolean(),
  })
  .passthrough();

export const InviteAcceptDataSchema = z.object({
  user: InviteAcceptUserSchema,
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  tokenType: z.string().min(1),
  permissions: z.array(z.string().min(1)),
  isUltimate: z.boolean(),
  is2FAEnforced: z.boolean(),
  requires2FASetup: z.boolean(),
});

export const InviteAcceptResponseSchema = z.object({
  success: z.literal(true),
  data: InviteAcceptDataSchema,
});

export const InviteAcceptRequestSchema = z.object({
  token: z.string().trim().min(20).max(512),
  password: z.string().min(8),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(15).optional(),
  designation: z.string().trim().max(120).optional(),
});

export type InviteUserResponse = z.infer<typeof InviteUserResponseSchema>;
export type InviteUserData = z.infer<typeof InviteUserDataSchema>;
export type SentInvitationsListResponse = z.infer<
  typeof SentInvitationsListResponseSchema
>;
export type SentInvitationItem = z.infer<typeof SentInvitationItemSchema>;
export type InvitePreviewResponse = z.infer<typeof InvitePreviewResponseSchema>;
export type InviteAcceptResponse = z.infer<typeof InviteAcceptResponseSchema>;
